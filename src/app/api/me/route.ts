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

  return NextResponse.json(
    {
      email: authResult.dbUser.email,
      plan: authResult.dbUser.plan,
      // Free quota usage: trips created (not dated) this Warsaw month
      tripsThisMonth,
      tripLimit: FREE_TRIPS_PER_MONTH,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
