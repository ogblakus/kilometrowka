import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { currentMonthKey, FREE_TRIPS_PER_MONTH } from "@/lib/plan";
import { parseAndValidateTripBody } from "@/lib/trip-validate";
import {
  countTripsInMonthDb,
  createTrip,
  listTrips,
} from "@/lib/trips-db";

export async function GET() {
  const authResult = await requireAuthUser();
  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status },
    );
  }

  try {
    const trips = await listTrips(authResult.userId);
    return NextResponse.json({ trips });
  } catch (err) {
    console.error("[api/trips GET]", err);
    return NextResponse.json(
      { error: "Nie udało się pobrać przejazdów." },
      { status: 500 },
    );
  }
}

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

  const parsed = parseAndValidateTripBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Plan from Neon DB (Clerk user id) — never trust client body/query for entitlement
  const plan = authResult.dbUser.plan === "premium" ? "premium" : "free";
  if (plan !== "premium") {
    const monthKey = currentMonthKey();
    const used = await countTripsInMonthDb(authResult.userId, monthKey);
    if (used >= FREE_TRIPS_PER_MONTH) {
      return NextResponse.json(
        {
          error: `Limit Free: ${FREE_TRIPS_PER_MONTH} przejazdów / miesiąc. Wykup Premium.`,
          code: "TRIP_QUOTA",
        },
        { status: 403 },
      );
    }
  }

  const id =
    body &&
    typeof body === "object" &&
    "id" in body &&
    typeof (body as { id: unknown }).id === "string"
      ? (body as { id: string }).id
      : undefined;

  try {
    const trip = await createTrip(authResult.userId, parsed, id);
    return NextResponse.json({ trip }, { status: 201 });
  } catch (err) {
    console.error("[api/trips POST]", err);
    return NextResponse.json(
      { error: "Nie udało się zapisać przejazdu." },
      { status: 500 },
    );
  }
}
