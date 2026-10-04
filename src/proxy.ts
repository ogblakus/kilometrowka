import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Next.js 16 uses proxy.ts (middleware.ts on ≤15).
 * Protect API handlers with auth() at the resource — clerkMiddleware only
 * attaches the session.
 */

function origin(hostOrUrl: string | undefined): string | null {
  if (!hostOrUrl) return null;
  try {
    return new URL(hostOrUrl.startsWith("http") ? hostOrUrl : `https://${hostOrUrl}`).origin;
  } catch {
    return null;
  }
}

/** Origins allowed as the session token's `azp` (audit: authorizedParties). */
function authorizedParties(): string[] | undefined {
  const list = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
  ]
    .map(origin)
    .filter((o): o is string => !!o);
  if (process.env.NODE_ENV !== "production") {
    list.push("http://localhost:3000", "http://127.0.0.1:3000");
  }
  // Never lock everyone out if the env is missing — fall back to Clerk defaults.
  return list.length ? [...new Set(list)] : undefined;
}

const parties = authorizedParties();

/** Webhooks are called server-to-server (no Origin) and verify signatures. */
const ORIGIN_EXEMPT = ["/api/stripe/webhook", "/api/clerk/webhook"];
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export default clerkMiddleware(
  async (_auth, req) => {
    const { pathname } = req.nextUrl;
    if (
      pathname.startsWith("/api/") &&
      MUTATING.has(req.method) &&
      !ORIGIN_EXEMPT.some((p) => pathname.startsWith(p))
    ) {
      // CSRF defence in depth: browsers always send Origin on cross-site
      // POST/PUT/PATCH/DELETE; reject if it doesn't match this host.
      const reqOrigin = req.headers.get("origin");
      if (reqOrigin) {
        const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
        let ok = false;
        try {
          ok = !!host && new URL(reqOrigin).host === host;
        } catch {
          ok = false;
        }
        if (!ok) {
          return NextResponse.json({ error: "Niedozwolone źródło żądania." }, { status: 403 });
        }
      }
    }
    return undefined;
  },
  parties ? { authorizedParties: parties } : undefined,
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
