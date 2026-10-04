import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

/* ---------------- shared mocks ---------------- */
type Q = { text: string; values: unknown[] };
const dbState: { queries: Q[]; responder: (q: Q) => unknown[] } = {
  queries: [],
  responder: () => [],
};
vi.mock("@/lib/db", () => {
  const tag = (strings: TemplateStringsArray, ...values: unknown[]) => {
    const q = { text: strings.join("$?").replace(/\s+/g, " "), values };
    dbState.queries.push(q);
    return Promise.resolve(dbState.responder(q));
  };
  return { getDb: () => tag };
});

const authState: { result: unknown } = { result: null };
vi.mock("@/lib/auth-api", () => ({
  requireAuthUser: async () => authState.result,
}));

vi.mock("@/lib/rate-limit", () => ({ rateLimitResponse: async () => null }));

const stripeMock = {
  subscriptions: { list: vi.fn(), retrieve: vi.fn(), cancel: vi.fn() },
  checkout: { sessions: { create: vi.fn() } },
  webhooks: new Stripe("sk_test_dummy").webhooks,
};
vi.mock("@/lib/stripe-server", () => ({
  getStripe: () => stripeMock,
  isStripeCheckoutConfigured: () => true,
  getPriceId: (i: string) => (i === "month" ? "price_month" : "price_year"),
  getPremiumPriceIds: () => ["price_month", "price_year"],
  resolveSiteUrl: () => "https://example.test",
}));

process.env.STRIPE_PRODUCT_ID_PREMIUM = "prod_premium";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";

const { POST: checkoutPOST } = await import("@/app/api/checkout/route");
const { POST: webhookPOST } = await import("@/app/api/stripe/webhook/route");
const sync = await import("@/lib/stripe-sync");

const user = (over: Record<string, unknown> = {}) => ({
  ok: true,
  userId: "user_1",
  dbUser: {
    clerk_user_id: "user_1",
    email: "jan@example.com",
    plan: "free",
    stripe_customer_id: null,
    stripe_subscription_id: null,
    subscription_status: null,
    current_period_end: null,
    ...over,
  },
});

const req = (body: unknown) =>
  new Request("https://example.test/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const validBody = { interval: "month", acceptTerms: true, earlyStart: true };

const sub = (over: Partial<Stripe.Subscription> & { product?: string; price?: string } = {}) =>
  ({
    id: over.id ?? "sub_1",
    status: over.status ?? "active",
    customer: "cus_1",
    metadata: over.metadata ?? { clerk_user_id: "user_1" },
    items: {
      data: [
        {
          price: { id: over.price ?? "price_month", product: over.product ?? "prod_premium" },
          current_period_end: 1_900_000_000,
        },
      ],
    },
  }) as unknown as Stripe.Subscription;

beforeEach(() => {
  dbState.queries = [];
  dbState.responder = () => [];
  authState.result = user();
  vi.clearAllMocks();
  stripeMock.subscriptions.list.mockResolvedValue({ data: [] });
  stripeMock.checkout.sessions.create.mockResolvedValue({ id: "cs_1", url: "https://checkout.stripe.com/c/cs_1" });
});

/* ---------------- checkout ---------------- */
describe("POST /api/checkout", () => {
  it("401 for anonymous users", async () => {
    authState.result = { ok: false, status: 401, error: "Wymagane logowanie." };
    const res = await checkoutPOST(req(validBody));
    expect(res.status).toBe(401);
  });

  it("requires both statements from /kup", async () => {
    let res = await checkoutPOST(req({ interval: "month", earlyStart: true }));
    expect(res.status).toBe(400);
    expect((await res.json()).field).toBe("acceptTerms");
    res = await checkoutPOST(req({ interval: "month", acceptTerms: true }));
    expect((await res.json()).field).toBe("earlyStart");
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("409 for an existing Premium user (no double purchase)", async () => {
    authState.result = user({ plan: "premium", subscription_status: "active" });
    const res = await checkoutPOST(req(validBody));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("already_premium");
  });

  it("409 when Stripe already has a live subscription for the customer", async () => {
    authState.result = user({ stripe_customer_id: "cus_1" });
    stripeMock.subscriptions.list.mockResolvedValue({ data: [{ status: "past_due" }] });
    const res = await checkoutPOST(req(validBody));
    expect(res.status).toBe(409);
  });

  it("reuses the Stripe customer and stores consent evidence", async () => {
    authState.result = user({ stripe_customer_id: "cus_1", subscription_status: "canceled" });
    const res = await checkoutPOST(req({ ...validBody, businessPurpose: "professional" }));
    expect(res.status).toBe(200);
    expect((await res.json()).url).toContain("checkout.stripe.com");
    const params = stripeMock.checkout.sessions.create.mock.calls[0][0];
    expect(params.customer).toBe("cus_1");
    expect(params.customer_email).toBeUndefined();
    expect(params.submit_type).toBe("pay");
    expect(params.metadata).toMatchObject({
      clerk_user_id: "user_1",
      early_start_request: "true",
      business_purpose: "professional",
    });
    expect(params.subscription_data.metadata.clerk_user_id).toBe("user_1");
    expect(dbState.queries.some((q) => q.text.includes("INSERT INTO checkout_consents"))).toBe(true);
  });

  it("new customer: passes the account e-mail", async () => {
    await checkoutPOST(req(validBody));
    const params = stripeMock.checkout.sessions.create.mock.calls[0][0];
    expect(params.customer).toBeUndefined();
    expect(params.customer_email).toBe("jan@example.com");
  });
});

/* ---------------- stripe-sync ---------------- */
describe("syncSubscriptionToUser", () => {
  it("matches Premium by product or by configured price id", () => {
    expect(sync.subscriptionHasPremiumProduct(sub({ product: "prod_other", price: "price_year" }), "prod_premium")).toBe(true);
    expect(sync.subscriptionHasPremiumProduct(sub({ product: "prod_other", price: "price_x" }), "prod_premium")).toBe(false);
  });

  it("grants Premium for active subscriptions", async () => {
    const r = await sync.syncSubscriptionToUser(sub(), "user_1");
    expect(r).toMatchObject({ ok: true, plan: "premium" });
    expect(dbState.queries.some((q) => q.text.includes("plan = 'premium'"))).toBe(true);
  });

  it("switches to another active Premium subscription instead of downgrading", async () => {
    stripeMock.subscriptions.list.mockResolvedValue({ data: [sub({ id: "sub_2" })] });
    const r = await sync.syncSubscriptionToUser(sub({ status: "canceled" }), "user_1", stripeMock as unknown as Stripe);
    expect(r).toMatchObject({ ok: true, plan: "premium" });
    const upd = dbState.queries.find((q) => q.text.includes("plan = 'premium'"));
    expect(upd?.values).toContain("sub_2");
  });

  it("a stale canceled subscription does not downgrade", async () => {
    dbState.responder = (q) => (q.text.includes("RETURNING plan") ? [] : []);
    const r = await sync.syncSubscriptionToUser(sub({ status: "canceled" }), "user_1");
    expect(r).toEqual({ ok: false, reason: "stale_subscription" });
  });

  it("flags unapplied payments", () => {
    expect(sync.isUnappliedPayment({ ok: false, reason: "user_not_found" })).toBe(true);
    expect(sync.isUnappliedPayment({ ok: false, reason: "stale_subscription" })).toBe(false);
  });
});

/* ---------------- webhook ---------------- */
function signed(event: object) {
  const payload = JSON.stringify(event);
  const header = stripeMock.webhooks.generateTestHeaderString({
    payload,
    secret: "whsec_test_secret",
  });
  return new Request("https://example.test/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": header },
    body: payload,
  });
}

describe("POST /api/stripe/webhook", () => {
  it("400 without or with an invalid signature", async () => {
    const res = await webhookPOST(new Request("https://example.test/x", { method: "POST", body: "{}" }));
    expect(res.status).toBe(400);
    const bad = await webhookPOST(
      new Request("https://example.test/x", { method: "POST", body: "{}", headers: { "stripe-signature": "t=1,v1=bad" } }),
    );
    expect(bad.status).toBe(400);
  });

  it("processes a signed subscription event once (claim → sync → mark)", async () => {
    dbState.responder = (q) =>
      q.text.includes("INSERT INTO stripe_events") && q.text.includes("'processing'") ? [{ id: "evt_1" }] : [];
    stripeMock.subscriptions.retrieve.mockResolvedValue(sub());
    const res = await webhookPOST(
      signed({ id: "evt_1", type: "customer.subscription.updated", data: { object: sub() } }),
    );
    expect(res.status).toBe(200);
    expect(dbState.queries.some((q) => q.text.includes("'processed'"))).toBe(true);
  });

  it("duplicate event is acknowledged without re-processing", async () => {
    dbState.responder = () => [];
    const res = await webhookPOST(
      signed({ id: "evt_1", type: "customer.subscription.updated", data: { object: sub() } }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).duplicate).toBe(true);
    expect(stripeMock.subscriptions.retrieve).not.toHaveBeenCalled();
  });

  it("500 + release when our paid checkout cannot be applied (Stripe retries)", async () => {
    dbState.responder = (q) =>
      q.text.includes("INSERT INTO stripe_events") && q.text.includes("'processing'") ? [{ id: "evt_2" }] : [];
    stripeMock.subscriptions.retrieve.mockResolvedValue(sub({ product: "prod_other", price: "price_x" }));
    const res = await webhookPOST(
      signed({
        id: "evt_2",
        type: "checkout.session.completed",
        data: { object: { mode: "subscription", subscription: "sub_1", client_reference_id: "user_1", metadata: {} } },
      }),
    );
    expect(res.status).toBe(500);
    expect(dbState.queries.some((q) => q.text.includes("DELETE FROM stripe_events"))).toBe(true);
  });
});
