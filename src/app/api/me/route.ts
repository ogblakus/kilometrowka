import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";

export async function GET() {
  const authResult = await requireAuthUser();
  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status },
    );
  }

  return NextResponse.json({
    email: authResult.dbUser.email,
    plan: authResult.dbUser.plan,
  });
}
