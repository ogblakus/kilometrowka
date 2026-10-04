import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { createPortalSession } from "@/lib/billing";
import { rateLimitResponse } from "@/lib/rate-limit";
import { getStripe, resolveSiteUrl } from "@/lib/stripe-server";

export const runtime = "nodejs";

/**
 * Stripe Customer Portal ("Zarządzaj subskrypcją / anuluj"): cancel at period
 * end, change card, invoices. Only for users with a Stripe customer.
 */
export async function POST(request: Request) {
  const authResult = await requireAuthUser();
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  const limited = await rateLimitResponse("portal", authResult.userId);
  if (limited) return limited;

  const customerId = authResult.dbUser.stripe_customer_id;
  if (!customerId) {
    return NextResponse.json(
      { error: "Brak subskrypcji do zarządzania.", code: "no_customer" },
      { status: 404 },
    );
  }
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Panel płatności jest chwilowo niedostępny." },
      { status: 503 },
    );
  }
  try {
    const url = await createPortalSession(stripe, customerId, resolveSiteUrl(request));
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[billing/portal]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      {
        error:
          "Nie udało się otworzyć panelu subskrypcji. Napisz na djpablo312@icloud.com — anulujemy ręcznie.",
      },
      { status: 502 },
    );
  }
}
