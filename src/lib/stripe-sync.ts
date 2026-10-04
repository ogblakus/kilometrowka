import "server-only";
import type Stripe from "stripe";
import { getDb } from "@/lib/db";
import type { Plan } from "@/lib/plan";
import { getPremiumPriceIds } from "@/lib/stripe-server";

/** Subscription statuses that grant Premium. */
const PREMIUM_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
]);

/**
 * Statuses where we keep the user's current plan untouched (Stripe is still
 * retrying payment; it ends in `canceled` or `unpaid` which downgrades).
 */
const GRACE_STATUSES = new Set<Stripe.Subscription.Status>(["past_due"]);

export function getPremiumProductId(): string | null {
  return process.env.STRIPE_PRODUCT_ID_PREMIUM?.trim() || null;
}

export function idOf(
  value: string | { id: string } | null | undefined,
): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return typeof value.id === "string" ? value.id : null;
}

/**
 * True when any subscription item is the Premium product or one of the
 * configured Premium prices (STRIPE_PRICE_ID_MONTHLY / _YEARLY).
 */
export function subscriptionHasPremiumProduct(
  sub: Stripe.Subscription,
  premiumProductId: string,
  premiumPriceIds: string[] = getPremiumPriceIds(),
): boolean {
  return sub.items.data.some(
    (item) =>
      idOf(item.price?.product as string | { id: string } | null) ===
        premiumProductId ||
      (Boolean(item.price?.id) && premiumPriceIds.includes(item.price.id)),
  );
}

/** Latest current_period_end across items (moved to items in newer API versions). */
export function subscriptionPeriodEnd(sub: Stripe.Subscription): Date | null {
  let max = 0;
  for (const item of sub.items.data) {
    const end = (item as { current_period_end?: number }).current_period_end;
    if (typeof end === "number" && end > max) max = end;
  }
  if (!max) {
    const legacy = (sub as { current_period_end?: number }).current_period_end;
    if (typeof legacy === "number") max = legacy;
  }
  return max ? new Date(max * 1000) : null;
}

export type SyncResult =
  | { ok: true; clerkUserId: string; plan: Plan | "unchanged"; status: string }
  | { ok: false; reason: string };

/** Find the app user for a subscription: explicit hint → metadata → customer → subscription. */
async function resolveClerkUserId(
  sub: Stripe.Subscription,
  hint: string | null,
): Promise<string | null> {
  const db = getDb();
  const customerId = idOf(sub.customer);
  const candidate = hint || sub.metadata?.clerk_user_id?.trim() || null;

  if (candidate) {
    // Webhooks can arrive before the user row exists (created lazily on first
    // authenticated API call) — create a minimal row so state isn't lost.
    await db`
      INSERT INTO users (clerk_user_id, plan, updated_at)
      VALUES (${candidate}, 'free', NOW())
      ON CONFLICT (clerk_user_id) DO NOTHING
    `;
    return candidate;
  }

  if (customerId) {
    const rows = await db`
      SELECT clerk_user_id FROM users WHERE stripe_customer_id = ${customerId} LIMIT 1
    `;
    if (rows[0]) return rows[0].clerk_user_id as string;
  }

  const rows = await db`
    SELECT clerk_user_id FROM users WHERE stripe_subscription_id = ${sub.id} LIMIT 1
  `;
  return rows[0] ? (rows[0].clerk_user_id as string) : null;
}

/**
 * Sync one Stripe subscription onto the users table.
 * Grants Premium only for the Premium product with status active/trialing;
 * downgrades to free on canceled/unpaid/incomplete_expired/etc.
 */
export async function syncSubscriptionToUser(
  sub: Stripe.Subscription,
  clerkUserIdHint: string | null = null,
  stripe: Stripe | null = null,
): Promise<SyncResult> {
  const premiumProductId = getPremiumProductId();
  if (!premiumProductId) {
    throw new Error("STRIPE_PRODUCT_ID_PREMIUM is not set");
  }

  if (!subscriptionHasPremiumProduct(sub, premiumProductId)) {
    return { ok: false, reason: "not_premium_product" };
  }

  const clerkUserId = await resolveClerkUserId(sub, clerkUserIdHint);
  if (!clerkUserId) {
    return { ok: false, reason: "user_not_found" };
  }

  const db = getDb();
  const customerId = idOf(sub.customer);
  const periodEnd = subscriptionPeriodEnd(sub);
  const status = sub.status;

  if (PREMIUM_STATUSES.has(status)) {
    await db`
      UPDATE users SET
        plan = 'premium',
        stripe_customer_id = COALESCE(${customerId}, stripe_customer_id),
        stripe_subscription_id = ${sub.id},
        subscription_status = ${status},
        current_period_end = ${periodEnd},
        updated_at = NOW()
      WHERE clerk_user_id = ${clerkUserId}
    `;
    return { ok: true, clerkUserId, plan: "premium", status };
  }

  // Non-granting status. If the customer still has another active Premium
  // subscription (e.g. a double purchase), switch to it instead of
  // downgrading (W2).
  if (stripe && customerId && !GRACE_STATUSES.has(status)) {
    const other = await findActivePremiumSubscription(
      stripe,
      customerId,
      premiumProductId,
      sub.id,
    );
    if (other) {
      return syncSubscriptionToUser(other, clerkUserId, null);
    }
  }

  // Only touch the user if this is their current subscription (or they have
  // none), so an old canceled subscription can't downgrade a user who already
  // re-subscribed.
  const keepPlan = GRACE_STATUSES.has(status);
  const rows = await db`
    UPDATE users SET
      plan = CASE WHEN ${keepPlan} THEN plan ELSE 'free' END,
      stripe_customer_id = COALESCE(stripe_customer_id, ${customerId}),
      stripe_subscription_id = ${sub.id},
      subscription_status = ${status},
      current_period_end = ${periodEnd},
      updated_at = NOW()
    WHERE clerk_user_id = ${clerkUserId}
      AND (stripe_subscription_id IS NULL OR stripe_subscription_id = ${sub.id})
    RETURNING plan
  `;
  if (!rows[0]) {
    return { ok: false, reason: "stale_subscription" };
  }
  return {
    ok: true,
    clerkUserId,
    plan: keepPlan ? "unchanged" : "free",
    status,
  };
}

/** Another active/trialing Premium subscription of the same customer, if any. */
export async function findActivePremiumSubscription(
  stripe: Stripe,
  customerId: string,
  premiumProductId: string,
  excludeId: string | null = null,
): Promise<Stripe.Subscription | null> {
  const list = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 20,
  });
  return (
    list.data.find(
      (s) =>
        s.id !== excludeId &&
        PREMIUM_STATUSES.has(s.status) &&
        subscriptionHasPremiumProduct(s, premiumProductId),
    ) ?? null
  );
}

/** Sync results that mean "a paid subscription could not be applied". */
export function isUnappliedPayment(result: SyncResult): boolean {
  return (
    !result.ok &&
    (result.reason === "not_premium_product" || result.reason === "user_not_found")
  );
}

/**
 * Claim a webhook event (insert-first idempotency, N3). Returns false when
 * the event was already processed or is being processed right now. A stale
 * "processing" claim (> 5 min, e.g. crashed invocation) can be taken over.
 */
export async function claimEvent(eventId: string, type: string): Promise<boolean> {
  const db = getDb();
  const rows = await db`
    INSERT INTO stripe_events (id, type, status, processed_at)
    VALUES (${eventId}, ${type}, 'processing', NOW())
    ON CONFLICT (id) DO UPDATE SET processed_at = NOW()
      WHERE stripe_events.status = 'processing'
        AND stripe_events.processed_at < NOW() - INTERVAL '5 minutes'
    RETURNING id
  `;
  return rows.length > 0;
}

/** Release a claim after a failure so Stripe's retry is processed. */
export async function releaseEvent(eventId: string): Promise<void> {
  const db = getDb();
  await db`DELETE FROM stripe_events WHERE id = ${eventId} AND status = 'processing'`;
}

/** Has this webhook event already been processed? */
export async function isEventProcessed(eventId: string): Promise<boolean> {
  const db = getDb();
  const rows = await db`SELECT 1 FROM stripe_events WHERE id = ${eventId}`;
  return rows.length > 0;
}

/** Record a processed event (after successful handling). */
export async function markEventProcessed(
  eventId: string,
  type: string,
): Promise<void> {
  const db = getDb();
  await db`
    INSERT INTO stripe_events (id, type, status, processed_at)
    VALUES (${eventId}, ${type}, 'processed', NOW())
    ON CONFLICT (id) DO UPDATE SET status = 'processed', processed_at = NOW()
  `;
}
