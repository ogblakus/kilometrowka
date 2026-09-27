import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { requireAuthUser } from "@/lib/auth-api";
import { getStripe, isStripeCheckoutConfigured } from "@/lib/stripe-server";
import {
  getPremiumProductId,
  subscriptionHasPremiumProduct,
  syncSubscriptionToUser,
} from "@/lib/stripe-sync";

/**
 * Fast-path after Stripe Checkout success (the webhook remains the source of
 * truth). Everything is verified server-side with Stripe — the client only
 * supplies a session id:
 *  - session is a completed, paid subscription checkout,
 *  - it belongs to the signed-in Clerk user (client_reference_id / metadata),
 *  - its subscription is for the Premium product and active/trialing.
 */
export async function POST(request: Request) {
  const authResult = await requireAuthUser();
  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy JSON." }, { status: 400 });
  }

  const sessionId =
    body &&
    typeof body === "object" &&
    "session_id" in body &&
    typeof (body as { session_id: unknown }).session_id === "string"
      ? (body as { session_id: string }).session_id.trim()
      : "";

  if (!sessionId || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    return NextResponse.json(
      { error: "Brak lub nieprawidłowe session_id.", paid: false },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const premiumProductId = getPremiumProductId();
  if (!isStripeCheckoutConfigured() || !stripe || !premiumProductId) {
    return NextResponse.json(
      { error: "Stripe nie jest skonfigurowany.", paid: false },
      { status: 503 },
    );
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
  } catch (err) {
    console.error(
      "[premium/activate] retrieve session",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      { error: "Nie znaleziono sesji płatności.", paid: false },
      { status: 404 },
    );
  }

  // Ownership: the session must have been created for this Clerk user.
  const owner =
    session.client_reference_id?.trim() ||
    session.metadata?.clerk_user_id?.trim() ||
    null;
  if (!owner || owner !== authResult.userId) {
    return NextResponse.json(
      { error: "Sesja należy do innego użytkownika.", paid: false },
      { status: 403 },
    );
  }

  const paid =
    session.mode === "subscription" &&
    session.status === "complete" &&
    (session.payment_status === "paid" ||
      session.payment_status === "no_payment_required");
  if (!paid) {
    return NextResponse.json({ paid: false, plan: authResult.dbUser.plan });
  }

  const sub =
    session.subscription && typeof session.subscription === "object"
      ? (session.subscription as Stripe.Subscription)
      : null;
  if (!sub || !subscriptionHasPremiumProduct(sub, premiumProductId)) {
    return NextResponse.json(
      { error: "Sesja nie dotyczy planu Premium.", paid: false },
      { status: 400 },
    );
  }

  try {
    const result = await syncSubscriptionToUser(sub, authResult.userId);
    const plan =
      result.ok && result.plan === "premium"
        ? "premium"
        : authResult.dbUser.plan;
    return NextResponse.json({ paid: plan === "premium", plan });
  } catch (err) {
    console.error("[premium/activate]", err);
    return NextResponse.json(
      { error: "Nie udało się aktywować Premium.", paid: false },
      { status: 500 },
    );
  }
}
