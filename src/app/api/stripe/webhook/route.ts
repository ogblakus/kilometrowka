import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe-server";
import {
  claimEvent,
  getPremiumProductId,
  idOf,
  isUnappliedPayment,
  markEventProcessed,
  releaseEvent,
  syncSubscriptionToUser,
  type SyncResult,
} from "@/lib/stripe-sync";

/**
 * Stripe webhook — source of truth for Premium entitlement.
 * Public route (no Clerk auth); authenticity is proven by the Stripe signature.
 *
 * Idempotency is insert-first (claimEvent). A paid subscription that cannot be
 * applied (wrong product / unknown user) for one of OUR checkouts is NOT
 * marked processed: we return 500 so Stripe retries and the failure is visible
 * in the Stripe Dashboard and logs (audit K1/S6).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HANDLED = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const stripe = getStripe();
  if (!secret || !stripe) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY missing");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe-Signature." }, { status: 400 });
  }

  // Raw body is required for signature verification — do not JSON.parse first.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.warn(
      "[stripe/webhook] signature verification failed:",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (!HANDLED.has(event.type)) {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  if (!getPremiumProductId()) {
    // Fail loudly so Stripe retries once the env var is set.
    console.error("[stripe/webhook] STRIPE_PRODUCT_ID_PREMIUM missing");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  let claimed = false;
  try {
    claimed = await claimEvent(event.id, event.type);
    if (!claimed) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    let result: SyncResult | { ok: false; reason: string } | null = null;
    /** True when the object was created by our checkout (has our metadata). */
    let ours = false;

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = idOf(session.subscription);
      const clerkUserId =
        session.client_reference_id?.trim() ||
        session.metadata?.clerk_user_id?.trim() ||
        null;
      ours = Boolean(clerkUserId);
      if (session.mode === "subscription" && subscriptionId) {
        // Always re-fetch: never trust payload state, handles out-of-order delivery.
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        result = await syncSubscriptionToUser(sub, clerkUserId, stripe);
      } else {
        result = { ok: false, reason: "not_subscription_checkout" };
      }
    } else {
      const payloadSub = event.data.object as Stripe.Subscription;
      ours = Boolean(payloadSub.metadata?.clerk_user_id);
      // Re-fetch the latest subscription state (deleted subs are still retrievable).
      const sub = await stripe.subscriptions.retrieve(payloadSub.id);
      result = await syncSubscriptionToUser(sub, null, stripe);
    }

    console.log("[stripe/webhook]", event.type, event.id, JSON.stringify(result));

    if (ours && result && isUnappliedPayment(result as SyncResult)) {
      console.error(
        "[stripe/webhook] ALERT: subscription from our checkout not applied",
        event.id,
        JSON.stringify(result),
      );
      await releaseEvent(event.id);
      return NextResponse.json({ error: "Subscription not applied." }, { status: 500 });
    }

    await markEventProcessed(event.id, event.type);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe/webhook] handler error", event.type, event.id, err);
    if (claimed) {
      await releaseEvent(event.id).catch(() => {});
    }
    // 500 → Stripe retries later; event is not marked processed.
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }
}
