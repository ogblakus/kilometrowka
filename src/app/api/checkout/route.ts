import { NextResponse } from "next/server";
import {
  getPriceId,
  getStripe,
  isStripeCheckoutConfigured,
  resolveSiteUrl,
} from "@/lib/stripe-server";

type Interval = "month" | "year";

function parseInterval(value: unknown): Interval | null {
  if (value === "month" || value === "year") return value;
  return null;
}

export async function GET() {
  return NextResponse.json({
    configured: isStripeCheckoutConfigured(),
  });
}

export async function POST(request: Request) {
  if (!isStripeCheckoutConfigured()) {
    return NextResponse.json(
      {
        error: "Stripe Checkout nie jest skonfigurowany.",
        code: "not_configured",
      },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      {
        error: "Brak STRIPE_SECRET_KEY.",
        code: "not_configured",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Nieprawidłowy JSON.", code: "bad_request" },
      { status: 400 },
    );
  }

  const interval = parseInterval(
    body && typeof body === "object" && "interval" in body
      ? (body as { interval: unknown }).interval
      : undefined,
  );

  if (!interval) {
    return NextResponse.json(
      {
        error: 'Pole "interval" musi być "month" lub "year".',
        code: "bad_request",
      },
      { status: 400 },
    );
  }

  const priceId = getPriceId(interval);
  if (!priceId) {
    return NextResponse.json(
      {
        error: "Brak Price ID dla wybranego interwału.",
        code: "not_configured",
      },
      { status: 503 },
    );
  }

  const site = resolveSiteUrl(request);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${site}/kup/sukces?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/kup`,
      locale: "pl",
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe nie zwrócił URL sesji.", code: "stripe_error" },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Nie udało się utworzyć sesji.";
    console.error("[checkout]", message);
    return NextResponse.json(
      { error: "Nie udało się utworzyć sesji Stripe Checkout.", code: "stripe_error" },
      { status: 502 },
    );
  }
}
