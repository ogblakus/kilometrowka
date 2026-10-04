import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { calcDieta, validateDietaInput } from "@/lib/dieta";
import { rateLimitResponse } from "@/lib/rate-limit";

/**
 * Per-diem calculator — computed server-side for Premium only (audit S3:
 * the calculation is no longer shipped in the client bundle).
 */
export async function POST(request: Request) {
  const authResult = await requireAuthUser();
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  if (authResult.dbUser.plan !== "premium") {
    return NextResponse.json(
      { error: "Kalkulator diet wymaga planu Premium.", code: "PREMIUM_REQUIRED" },
      { status: 403 },
    );
  }
  const limited = await rateLimitResponse("dieta", authResult.userId);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy JSON." }, { status: 400 });
  }
  const parsed = validateDietaInput(body);
  if ("errors" in parsed) {
    return NextResponse.json(
      { error: "Popraw zaznaczone pola.", errors: parsed.errors },
      { status: 400 },
    );
  }
  const result = calcDieta(parsed);
  if (!result) {
    return NextResponse.json(
      { error: "Koniec podróży musi być później niż początek.", errors: { end: "Koniec musi być później niż początek." } },
      { status: 400 },
    );
  }
  return NextResponse.json({ result }, { headers: { "Cache-Control": "no-store" } });
}
