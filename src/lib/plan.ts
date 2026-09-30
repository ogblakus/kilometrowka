import type { Trip } from "./types";

export type Plan = "free" | "premium";

export const FREE_TRIPS_PER_MONTH = 10;
export const PREMIUM_PRICE_MONTHLY = 29;
export const PREMIUM_PRICE_YEARLY = 279; // ~20% off vs 29×12

/** Legacy localStorage key that used to cache the plan client-side. */
const LEGACY_PLAN_KEY = "kilometrowka.app.plan.v1";

/**
 * Remove the legacy local plan cache. The plan is never read from
 * localStorage anymore: signed-in users get it only from GET /api/me (Neon),
 * guests are always Free.
 */
export function clearLocalPlan(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LEGACY_PLAN_KEY);
  } catch {
    /* ignore */
  }
}

/** Current calendar month key in Europe/Warsaw (YYYY-MM). */
export function currentMonthKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .slice(0, 7);
}

export function countTripsInMonth(trips: Trip[], monthKey: string): number {
  return trips.filter((t) => t.date.startsWith(monthKey)).length;
}

/** Free plan quota check given the number of trips already used this month. */
export function isWithinFreeQuota(plan: Plan, used: number): boolean {
  if (plan === "premium") return true;
  return used < FREE_TRIPS_PER_MONTH;
}

/** Guest (local) check: counts local trips dated in the current month. */
export function canAddTrip(plan: Plan, trips: Trip[]): boolean {
  return isWithinFreeQuota(plan, countTripsInMonth(trips, currentMonthKey()));
}

export function canExportExcel(plan: Plan): boolean {
  return plan === "premium";
}

export function canUseDieta(plan: Plan): boolean {
  return plan === "premium";
}

/** Legacy public checkout URL (Lemon / Stripe Payment Link). Prefer server Checkout Sessions. */
export function getCheckoutUrl(): string | null {
  const lemon = process.env.NEXT_PUBLIC_LEMON_CHECKOUT_URL?.trim();
  const stripe = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK?.trim();
  if (lemon) return lemon;
  if (stripe) return stripe;
  return null;
}
