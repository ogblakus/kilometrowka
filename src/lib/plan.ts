import type { Trip } from "./types";

export type Plan = "free" | "premium";

export const FREE_TRIPS_PER_MONTH = 10;
export const PREMIUM_PRICE_MONTHLY = 29;
export const PREMIUM_PRICE_YEARLY = 279; // ~20% off vs 29×12

const PLAN_KEY = "kilometrowka.app.plan.v1";

export function loadPlan(): Plan {
  if (typeof window === "undefined") return "free";
  const raw = localStorage.getItem(PLAN_KEY);
  return raw === "premium" ? "premium" : "free";
}

export function savePlan(plan: Plan): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAN_KEY, plan);
  window.dispatchEvent(new Event("kilometrowka:plan"));
}

/** Reset guest/local plan (e.g. after sign-out — Premium lives on the account). */
export function clearLocalPlan(): void {
  savePlan("free");
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

export function canAddTrip(plan: Plan, trips: Trip[]): boolean {
  if (plan === "premium") return true;
  return countTripsInMonth(trips, currentMonthKey()) < FREE_TRIPS_PER_MONTH;
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
