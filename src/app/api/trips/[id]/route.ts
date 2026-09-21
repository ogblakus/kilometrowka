import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { deleteTrip, updateTrip, type TripInput } from "@/lib/trips-db";
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

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const authResult = await requireAuthUser();
  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status },
    );
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Brak id." }, { status: 400 });
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

  try {
    const trip = await updateTrip(authResult.userId, id, parsed);
    if (!trip) {
      return NextResponse.json({ error: "Nie znaleziono." }, { status: 404 });
    }
    return NextResponse.json({ trip });
  } catch (err) {
    console.error("[api/trips PATCH]", err);
    return NextResponse.json(
      { error: "Nie udało się zaktualizować." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  const authResult = await requireAuthUser();
  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status },
    );
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Brak id." }, { status: 400 });
  }

  try {
    const ok = await deleteTrip(authResult.userId, id);
    if (!ok) {
      return NextResponse.json({ error: "Nie znaleziono." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/trips DELETE]", err);
    return NextResponse.json(
      { error: "Nie udało się usunąć." },
      { status: 500 },
    );
  }
}
