import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAuthUser } from "@/lib/auth-api";
import { CANCELLABLE_SUB_STATUSES } from "@/lib/billing";
import { rateLimitResponse } from "@/lib/rate-limit";
import { getStripe } from "@/lib/stripe-server";
import { deleteUserData } from "@/lib/users";

export const runtime = "nodejs";

/**
 * DELETE /api/account — "Usuń konto" (RODO art. 17, Regulamin § 5 ust. 5–6).
 * Body: { confirm: "USUŃ" }. Cancels any live Stripe subscription immediately
 * (the UI explains that cancelling at period end is done in the portal),
 * deletes the DB rows (trips via CASCADE) and the Clerk user.
 */
export async function DELETE(request: Request) {
  const authResult = await requireAuthUser();
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  const { userId, dbUser } = authResult;
  const limited = await rateLimitResponse("account", userId);
  if (limited) return limited;

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    /* handled below */
  }
  if (!body || typeof body !== "object" || (body as { confirm?: unknown }).confirm !== "USUŃ") {
    return NextResponse.json(
      { error: 'Aby usunąć konto, wpisz „USUŃ”.', code: "confirm_required" },
      { status: 400 },
    );
  }

  // 1) Stop future charges first.
  if (dbUser.stripe_customer_id) {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Nie można teraz anulować subskrypcji. Spróbuj później." },
        { status: 503 },
      );
    }
    try {
      const subs = await stripe.subscriptions.list({
        customer: dbUser.stripe_customer_id,
        status: "all",
        limit: 20,
      });
      for (const s of subs.data) {
        if (CANCELLABLE_SUB_STATUSES.has(s.status)) {
          await stripe.subscriptions.cancel(s.id);
        }
      }
    } catch (err) {
      console.error("[account delete] stripe cancel", err instanceof Error ? err.message : err);
      return NextResponse.json(
        { error: "Nie udało się anulować subskrypcji — konto nie zostało usunięte. Spróbuj ponownie." },
        { status: 502 },
      );
    }
  }

  // 2) App data (users → trips, trip_quota cascade).
  try {
    await deleteUserData(userId);
  } catch (err) {
    console.error("[account delete] db", err);
    return NextResponse.json({ error: "Nie udało się usunąć danych." }, { status: 500 });
  }

  // 3) Identity at Clerk (signs the user out everywhere).
  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);
  } catch (err) {
    console.error("[account delete] clerk", err instanceof Error ? err.message : err);
    return NextResponse.json(
      {
        ok: true,
        warning:
          "Dane w aplikacji usunięto, ale nie udało się usunąć konta logowania. Napisz na djpablo312@icloud.com.",
      },
      { status: 200 },
    );
  }

  return NextResponse.json({ ok: true });
}
