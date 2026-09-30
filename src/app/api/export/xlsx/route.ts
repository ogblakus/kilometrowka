import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { buildTripsXlsx } from "@/lib/export-xlsx";
import { listTripsForExport } from "@/lib/trips-db";

export const runtime = "nodejs";

/** Excel export — Premium only, plan read from Neon; trips read from Neon. */
export async function GET(request: Request) {
  const authResult = await requireAuthUser();
  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status },
    );
  }

  if (authResult.dbUser.plan !== "premium") {
    return NextResponse.json(
      { error: "Eksport Excel wymaga planu Premium.", code: "PREMIUM_REQUIRED" },
      { status: 403 },
    );
  }

  const month = new URL(request.url).searchParams.get("month")?.trim() || "";
  if (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json(
      { error: "Nieprawidłowy miesiąc." },
      { status: 400 },
    );
  }

  try {
    const trips = await listTripsForExport(authResult.userId, month || undefined);
    const buf = await buildTripsXlsx(trips);
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="ewidencja-kilometrowka-${stamp}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[api/export/xlsx]", err);
    return NextResponse.json(
      { error: "Nie udało się wygenerować pliku Excel." },
      { status: 500 },
    );
  }
}
