import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { FREE_TRIPS_PER_MONTH } from "@/lib/plan";
import { countTripsCreatedThisMonthDb } from "@/lib/trips-db";

export async function GET() {
  const authResult = await requireAuthUser();
  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status },
    );
  }

  let tripsThisMonth: number | null = null;
  try {
    tripsThisMonth = await countTripsCreatedThisMonthDb(authResult.userId);
  } catch (err) {
    console.error("[api/me] count", err);
  }

  const u = authResult.dbUser;
  return NextResponse.json(
    {
      email: u.email,
      plan: u.plan,
      // Free quota usage: trips CREATED this Warsaw month (deletes don't refund)
      tripsThisMonth,
      tripLimit: FREE_TRIPS_PER_MONTH,
      subscription: u.stripe_customer_id
        ? {
            status: u.subscription_status,
            currentPeriodEnd: u.current_period_end,
            manageable: true,
          }
        : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
