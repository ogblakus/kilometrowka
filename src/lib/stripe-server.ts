import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;
let clientKey: string | null = null;

/** Memoised Stripe client (N14). API version = the SDK's pinned version. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!client || clientKey !== key) {
    client = new Stripe(key, { maxNetworkRetries: 2, timeout: 20_000 });
    clientKey = key;
  }
  return client;
}

export function isStripeCheckoutConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  const monthly = process.env.STRIPE_PRICE_ID_MONTHLY?.trim();
  const yearly = process.env.STRIPE_PRICE_ID_YEARLY?.trim();
  return Boolean(key && monthly && yearly);
}

export function getPriceId(interval: "month" | "year"): string | null {
  if (interval === "month") {
    return process.env.STRIPE_PRICE_ID_MONTHLY?.trim() || null;
  }
  return process.env.STRIPE_PRICE_ID_YEARLY?.trim() || null;
}

/** Configured Premium price ids (entitlement also maps by price — K1 hardening). */
export function getPremiumPriceIds(): string[] {
  return [getPriceId("month"), getPriceId("year")].filter(
    (x): x is string => Boolean(x),
  );
}

/**
 * Public site origin for Stripe success/cancel/return URLs.
 * Never derived from request headers in production (N2: open redirect).
 */
export function resolveSiteUrl(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (prod) return `https://${prod}`;
  if (process.env.NODE_ENV !== "production") {
    const host = request.headers.get("host") || "localhost:3000";
    return `http://${host}`;
  }
  throw new Error("NEXT_PUBLIC_SITE_URL is not set");
}
