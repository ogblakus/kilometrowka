import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { parseAndValidateTripBody } from "@/lib/trip-validate";
import { deleteTrip, updateTrip } from "@/lib/trips-db";

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

  const parsed = parseAndValidateTripBody(body);
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
