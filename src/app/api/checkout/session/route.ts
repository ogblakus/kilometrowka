import { NextResponse } from "next/server";
import { getStripe, isStripeCheckoutConfigured } from "@/lib/stripe-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id")?.trim();

  if (!sessionId) {
    return NextResponse.json(
      { error: "Brak parametru session_id.", paid: false },
      { status: 400 },
    );
  }

  if (!isStripeCheckoutConfigured()) {
    return NextResponse.json(
      {
        error: "Stripe nie jest skonfigurowany.",
        code: "not_configured",
        paid: false,
      },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Brak STRIPE_SECRET_KEY.", paid: false, code: "not_configured" },
      { status: 503 },
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid =
      session.payment_status === "paid" ||
      session.status === "complete";

    const customerEmail =
      session.customer_details?.email ||
      (typeof session.customer_email === "string"
        ? session.customer_email
        : undefined) ||
      undefined;

    return NextResponse.json({
      paid,
      ...(customerEmail ? { customerEmail } : {}),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Nie udało się pobrać sesji.";
    console.error("[checkout/session]", message);
    return NextResponse.json(
      { error: "Nie udało się zweryfikować sesji.", paid: false },
      { status: 404 },
    );
  }
}
