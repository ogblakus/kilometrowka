import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { createTrip, listTrips, type TripInput } from "@/lib/trips-db";
import type { VehicleType } from "@/lib/types";

const VEHICLES = new Set<VehicleType>([
  "samochod_do_900",
  "samochod_ponad_900",
  "motocykl",
  "motorower",
]);

function parseTripBody(body: unknown): TripInput | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Nieprawidłowy JSON." };
  }
  const b = body as Record<string, unknown>;
  const date = typeof b.date === "string" ? b.date.trim() : "";
  const from = typeof b.from === "string" ? b.from.trim() : "";
  const to = typeof b.to === "string" ? b.to.trim() : "";
  const purpose = typeof b.purpose === "string" ? b.purpose.trim() : "";
  const vehicle = b.vehicle as VehicleType;
  const km = typeof b.km === "number" ? b.km : Number(b.km);
  const amount = typeof b.amount === "number" ? b.amount : Number(b.amount);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: "Nieprawidłowa data." };
  }
  if (!from || !to) {
    return { error: "Wymagane pola from i to." };
  }
  if (!Number.isFinite(km) || km <= 0) {
    return { error: "Nieprawidłowe km." };
  }
  if (!Number.isFinite(amount) || amount < 0) {
    return { error: "Nieprawidłowa kwota." };
  }
  if (!VEHICLES.has(vehicle)) {
    return { error: "Nieprawidłowy pojazd." };
  }

  return {
    date,
    from,
    to,
    km,
    purpose: purpose || "—",
    vehicle,
    amount,
  };
}

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

  const parsed = parseTripBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
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
