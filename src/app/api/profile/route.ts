import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { rateLimitResponse } from "@/lib/rate-limit";
import { parseProfileBody } from "@/lib/trip-validate";
import { getProfile, updateProfile } from "@/lib/users";

/** Ewidencja profile: person, address, vehicle registration, engine capacity. */
export async function GET() {
  const authResult = await requireAuthUser();
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  try {
    const profile = await getProfile(authResult.userId);
    return NextResponse.json({ profile }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/profile GET]", err);
    return NextResponse.json({ error: "Nie udało się pobrać danych." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAuthUser();
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  const limited = await rateLimitResponse("profile", authResult.userId);
  if (limited) return limited;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy JSON." }, { status: 400 });
  }
  const parsed = parseProfileBody(body);
  if ("error" in parsed) {
    return NextResponse.json(parsed, { status: 400 });
  }
  try {
    const profile = await updateProfile(authResult.userId, parsed);
    return NextResponse.json({ profile });
  } catch (err) {
    console.error("[api/profile PUT]", err);
    return NextResponse.json({ error: "Nie udało się zapisać danych." }, { status: 500 });
  }
}
