import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Next.js 16 uses proxy.ts (middleware.ts on ≤15).
 * Protect API handlers with auth() at the resource — clerkMiddleware only attaches the session.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
