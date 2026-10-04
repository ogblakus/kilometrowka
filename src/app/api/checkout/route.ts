import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { BLOCKING_SUB_STATUSES } from "@/lib/billing";
import { getDb } from "@/lib/db";
import {
  BUSINESS_PURPOSE_LABELS,
  EARLY_START_TEXT,
  STRIPE_SUBMIT_MESSAGE,
  TERMS_VERSION,
  termsConsentText,
  type BusinessPurpose,
} from "@/lib/legal";
import { PREMIUM_PRICE_MONTHLY, PREMIUM_PRICE_YEARLY } from "@/lib/plan";
import { rateLimitResponse } from "@/lib/rate-limit";
import {
  getPriceId,
  getStripe,
  isStripeCheckoutConfigured,
  resolveSiteUrl,
} from "@/lib/stripe-server";

export const runtime = "nodejs";

type Interval = "month" | "year";

function parseInterval(value: unknown): Interval | null {
  if (value === "month" || value === "year") return value;
  return null;
}

function parseBusinessPurpose(value: unknown): BusinessPurpose | null {
  return value === "professional" || value === "non_professional" ? value : null;
}

/**
 * Create a Stripe Checkout Session for Premium.
 * Body: { interval, acceptTerms: true, earlyStart: true, businessPurpose? }.
 * The statements from /kup are validated and stored as evidence
 * (checkout_consents + session metadata) before redirecting to Stripe.
 */
export async function POST(request: Request) {
  if (!isStripeCheckoutConfigured()) {
    return NextResponse.json(
      { error: "Płatności są chwilowo niedostępne.", code: "not_configured" },
      { status: 503 },
    );
  }
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Płatności są chwilowo niedostępne.", code: "not_configured" },
      { status: 503 },
    );
  }

  const authResult = await requireAuthUser();
  if (!authResult.ok) {
    return NextResponse.json(
      {
        error:
          authResult.status === 401 ? "Zaloguj się, aby kupić Premium." : authResult.error,
        code: authResult.status === 401 ? "auth_required" : "unavailable",
      },
      { status: authResult.status },
    );
  }
  const { userId, dbUser } = authResult;

  const limited = await rateLimitResponse("checkout", userId);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Nieprawidłowy JSON.", code: "bad_request" },
      { status: 400 },
    );
  }
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;

  const interval = parseInterval(b.interval);
  if (!interval) {
    return NextResponse.json(
      { error: 'Pole "interval" musi być "month" lub "year".', code: "bad_request" },
      { status: 400 },
    );
  }
  if (b.acceptTerms !== true) {
    return NextResponse.json(
      { error: "Zaakceptuj Regulamin, aby złożyć zamówienie.", code: "consent_required", field: "acceptTerms" },
      { status: 400 },
    );
  }
  if (b.earlyStart !== true) {
    return NextResponse.json(
      {
        error: "Zaznacz żądanie rozpoczęcia świadczenia przed upływem terminu do odstąpienia.",
        code: "consent_required",
        field: "earlyStart",
      },
      { status: 400 },
    );
  }
  const businessPurpose = parseBusinessPurpose(b.businessPurpose);

  // W2: no second subscription for an existing Premium user.
  if (
    dbUser.plan === "premium" &&
    (!dbUser.subscription_status || BLOCKING_SUB_STATUSES.has(dbUser.subscription_status))
  ) {
    return NextResponse.json(
      {
        error: "Masz już aktywne Premium. Subskrypcją zarządzasz w ustawieniach konta.",
        code: "already_premium",
      },
      { status: 409 },
    );
  }

  const priceId = getPriceId(interval);
  if (!priceId) {
    return NextResponse.json(
      { error: "Płatności są chwilowo niedostępne.", code: "not_configured" },
      { status: 503 },
    );
  }

  let site: string;
  try {
    site = resolveSiteUrl(request);
  } catch (err) {
    console.error("[checkout] site url", err);
    return NextResponse.json(
      { error: "Płatności są chwilowo niedostępne.", code: "not_configured" },
      { status: 503 },
    );
  }

  const price = interval === "month" ? PREMIUM_PRICE_MONTHLY : PREMIUM_PRICE_YEARLY;
  const termsText = termsConsentText(interval, price);
  const acceptedAt = new Date().toISOString();

  // Customer reuse: also catches a live subscription not yet seen by webhooks.
  if (dbUser.stripe_customer_id) {
    try {
      const subs = await stripe.subscriptions.list({
        customer: dbUser.stripe_customer_id,
        status: "all",
        limit: 10,
      });
      if (subs.data.some((s) => BLOCKING_SUB_STATUSES.has(s.status))) {
        return NextResponse.json(
          {
            error: "Masz już aktywną subskrypcję. Zarządzasz nią w ustawieniach konta.",
            code: "already_premium",
          },
          { status: 409 },
        );
      }
    } catch (err) {
      console.error("[checkout] list subscriptions", err instanceof Error ? err.message : err);
    }
  }

  const metadata: Record<string, string> = {
    clerk_user_id: userId,
    terms_version: TERMS_VERSION,
    terms_accepted_at: acceptedAt,
    early_start_request: "true",
    billing_interval: interval,
    ...(businessPurpose ? { business_purpose: businessPurpose } : {}),
  };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${site}/kup/sukces?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/kup`,
      locale: "pl",
      submit_type: "pay",
      allow_promotion_codes: true,
      client_reference_id: userId,
      ...(dbUser.stripe_customer_id
        ? { customer: dbUser.stripe_customer_id }
        : dbUser.email
          ? { customer_email: dbUser.email }
          : {}),
      custom_text: { submit: { message: STRIPE_SUBMIT_MESSAGE } },
      metadata,
      subscription_data: { metadata },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Nie udało się rozpocząć płatności.", code: "stripe_error" },
        { status: 502 },
      );
    }

    try {
      await getDb()`
        INSERT INTO checkout_consents (
          clerk_user_id, billing_interval, price_pln, terms_version, terms_text,
          early_start_text, business_purpose, checkout_session_id, created_at
        ) VALUES (
          ${userId}, ${interval}, ${price}, ${TERMS_VERSION},
          ${termsText + (businessPurpose ? ` [Oświadczenie: ${BUSINESS_PURPOSE_LABELS[businessPurpose]}]` : "")},
          ${EARLY_START_TEXT}, ${businessPurpose}, ${session.id}, ${acceptedAt}
        )
      `;
    } catch (err) {
      // Evidence is also in the Stripe session metadata; don't block payment.
      console.error("[checkout] consent insert", err);
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Nie udało się rozpocząć płatności.", code: "stripe_error" },
      { status: 502 },
    );
  }
}
