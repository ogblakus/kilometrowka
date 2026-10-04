import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { CANCELLABLE_SUB_STATUSES } from "@/lib/billing";
import { getStripe } from "@/lib/stripe-server";
import { deleteUserData, getUser, updateUserEmail } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Clerk webhook (Svix-signed): keeps Neon in sync with Clerk (audit S7).
 *  - user.deleted → cancel Stripe subscription, delete users row (trips cascade)
 *  - user.updated → refresh the primary e-mail
 * Configure in Clerk Dashboard → Webhooks → endpoint /api/clerk/webhook,
 * events user.deleted + user.updated; secret in CLERK_WEBHOOK_SIGNING_SECRET.
 */
export async function POST(request: NextRequest) {
  if (!process.env.CLERK_WEBHOOK_SIGNING_SECRET?.trim()) {
    console.error("[clerk/webhook] CLERK_WEBHOOK_SIGNING_SECRET missing");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  let evt: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    evt = await verifyWebhook(request);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    if (evt.type === "user.deleted") {
      const id = evt.data.id;
      if (id) {
        const user = await getUser(id);
        const stripe = getStripe();
        if (user?.stripe_customer_id && stripe) {
          const subs = await stripe.subscriptions.list({
            customer: user.stripe_customer_id,
            status: "all",
            limit: 20,
          });
          for (const s of subs.data) {
            if (CANCELLABLE_SUB_STATUSES.has(s.status)) await stripe.subscriptions.cancel(s.id);
          }
        }
        await deleteUserData(id);
      }
    } else if (evt.type === "user.updated") {
      const d = evt.data;
      const primary =
        d.email_addresses?.find((e) => e.id === d.primary_email_address_id)?.email_address ??
        d.email_addresses?.[0]?.email_address ??
        null;
      await updateUserEmail(d.id, primary);
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[clerk/webhook]", evt.type, err);
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }
}
