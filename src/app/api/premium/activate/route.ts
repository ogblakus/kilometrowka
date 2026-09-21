import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { setUserPlan } from "@/lib/users";
import { getStripe, isStripeCheckoutConfigured } from "@/lib/stripe-server";

/** After Stripe Checkout success: verify session and set users.plan = premium. */
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

  if (!sessionId) {
    return NextResponse.json(
      { error: "Brak session_id.", paid: false },
      { status: 400 },
    );
  }

  if (!isStripeCheckoutConfigured()) {
    return NextResponse.json(
      { error: "Stripe nie jest skonfigurowany.", paid: false },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Brak STRIPE_SECRET_KEY.", paid: false },
      { status: 503 },
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid =
      session.payment_status === "paid" || session.status === "complete";

    if (!paid) {
      return NextResponse.json({ paid: false, plan: authResult.dbUser.plan });
    }

    const ref = session.client_reference_id;
    if (ref && ref !== authResult.userId) {
      return NextResponse.json(
        { error: "Sesja należy do innego użytkownika.", paid: false },
        { status: 403 },
      );
    }

    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer &&
            typeof session.customer === "object" &&
            "id" in session.customer
          ? String((session.customer as { id: string }).id)
          : null;
    const subId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription &&
            typeof session.subscription === "object" &&
            "id" in session.subscription
          ? String((session.subscription as { id: string }).id)
          : null;

    const updated = await setUserPlan(authResult.userId, "premium", {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subId,
    });

    return NextResponse.json({
      paid: true,
      plan: updated?.plan ?? "premium",
    });
  } catch (err) {
    console.error("[premium/activate]", err);
    return NextResponse.json(
      { error: "Nie udało się aktywować Premium.", paid: false },
      { status: 500 },
    );
  }
}
