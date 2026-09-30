import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { FREE_TRIPS_PER_MONTH } from "@/lib/plan";
import { isUuid, parseAndValidateTripBody } from "@/lib/trip-validate";
import { createTripWithQuota, listTrips } from "@/lib/trips-db";

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

  // Client-supplied id is optional (used when importing local trips); must be a UUID.
  const rawId =
    body && typeof body === "object" && "id" in body
      ? (body as { id: unknown }).id
      : undefined;
  if (rawId !== undefined && rawId !== null && rawId !== "" && !isUuid(rawId)) {
    return NextResponse.json({ error: "Nieprawidłowe id." }, { status: 400 });
  }
  const id = isUuid(rawId) ? rawId.toLowerCase() : undefined;

  try {
    // Plan is read from Neon inside the insert; quota counts trips created
    // (created_at) this Warsaw month, enforced atomically in one transaction.
    const result = await createTripWithQuota(
      authResult.userId,
      parsed,
      FREE_TRIPS_PER_MONTH,
      id,
    );
    if (!result.ok) {
      return NextResponse.json(
        {
          error: `Limit Free: ${FREE_TRIPS_PER_MONTH} przejazdów / miesiąc. Wykup Premium.`,
          code: "TRIP_QUOTA",
        },
        { status: 403 },
      );
    }
    return NextResponse.json({ trip: result.trip }, { status: 201 });
  } catch (err) {
    if ((err as { code?: string } | null)?.code === "23505") {
      return NextResponse.json(
        { error: "Przejazd o tym id już istnieje.", code: "TRIP_EXISTS" },
        { status: 409 },
      );
    }
    console.error("[api/trips POST]", err);
    return NextResponse.json(
      { error: "Nie udało się zapisać przejazdu." },
      { status: 500 },
    );
  }
}
