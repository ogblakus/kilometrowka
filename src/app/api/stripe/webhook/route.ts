import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe-server";
import {
  getPremiumProductId,
  idOf,
  isEventProcessed,
  markEventProcessed,
  syncSubscriptionToUser,
} from "@/lib/stripe-sync";

/**
 * Stripe webhook — source of truth for Premium entitlement.
 * Public route (no Clerk auth); authenticity is proven by the Stripe signature.
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

  try {
    if (await isEventProcessed(event.id)) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    let result: unknown = null;

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = idOf(session.subscription);
      if (session.mode === "subscription" && subscriptionId) {
        const clerkUserId =
          session.client_reference_id?.trim() ||
          session.metadata?.clerk_user_id?.trim() ||
          null;
        // Always re-fetch: never trust payload state, and handles out-of-order delivery.
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        result = await syncSubscriptionToUser(sub, clerkUserId);
      } else {
        result = { ok: false, reason: "not_subscription_checkout" };
      }
    } else {
      const payloadSub = event.data.object as Stripe.Subscription;
      // Re-fetch the latest subscription state (deleted subs are still retrievable).
      const sub = await stripe.subscriptions.retrieve(payloadSub.id);
      result = await syncSubscriptionToUser(sub, null);
    }

    await markEventProcessed(event.id, event.type);
    console.log("[stripe/webhook]", event.type, event.id, JSON.stringify(result));
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe/webhook] handler error", event.type, event.id, err);
    // 500 → Stripe retries later; event is not marked processed.
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }
}
