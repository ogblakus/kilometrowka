import "server-only";
import Stripe from "stripe";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
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

/** Public site origin for success/cancel URLs. */
export function resolveSiteUrl(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    "localhost:3000";
  return `${proto}://${host}`;
}
