import "server-only";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * Fixed-window rate limiting stored in Postgres (no extra service).
 * One upsert per checked request; windows older than 1 day are pruned
 * opportunistically. Fails OPEN on DB errors so a limiter hiccup never
 * blocks payments — the error is logged.
 */
export type RateLimitRule = { limit: number; windowSec: number };

export const RATE_LIMITS = {
  checkout: { limit: 10, windowSec: 60 },
  activate: { limit: 10, windowSec: 60 },
  portal: { limit: 10, windowSec: 60 },
  account: { limit: 5, windowSec: 600 },
  trips: { limit: 60, windowSec: 60 },
  tripsRead: { limit: 120, windowSec: 60 },
  export: { limit: 20, windowSec: 60 },
  dieta: { limit: 120, windowSec: 60 },
  profile: { limit: 30, windowSec: 60 },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitName = keyof typeof RATE_LIMITS;

export function windowStart(now: number, windowSec: number): Date {
  const ms = windowSec * 1000;
  return new Date(Math.floor(now / ms) * ms);
}

export async function checkRateLimit(
  name: RateLimitName,
  subject: string,
  now: number = Date.now(),
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const rule = RATE_LIMITS[name];
  const start = windowStart(now, rule.windowSec);
  const key = `${name}:${subject}`;
  try {
    const db = getDb();
    const rows = await db`
      INSERT INTO rate_limits (key, window_start, count)
      VALUES (${key}, ${start.toISOString()}, 1)
      ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1
      RETURNING count
    `;
    if (Math.random() < 0.01) {
      void db`DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 day'`.catch(
        () => {},
      );
    }
    const count = Number((rows[0] as { count: number } | undefined)?.count ?? 0);
    if (count > rule.limit) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((start.getTime() + rule.windowSec * 1000 - now) / 1000),
      );
      return { ok: false, retryAfterSec };
    }
    return { ok: true };
  } catch (err) {
    console.error("[rate-limit] fail-open", name, err);
    return { ok: true };
  }
}

/** Returns a 429 response when limited, otherwise null. */
export async function rateLimitResponse(
  name: RateLimitName,
  subject: string,
): Promise<NextResponse | null> {
  const r = await checkRateLimit(name, subject);
  if (r.ok) return null;
  return NextResponse.json(
    { error: "Zbyt wiele żądań. Spróbuj ponownie za chwilę.", code: "RATE_LIMITED" },
    { status: 429, headers: { "Retry-After": String(r.retryAfterSec) } },
  );
}
