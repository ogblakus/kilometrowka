import type { Trip, WaitlistEntry } from "./types";

const TRIPS_KEY = "kilometrowka.app.trips.v1";
const WAITLIST_KEY = "kilometrowka.app.waitlist.v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadTrips(): Trip[] {
  if (typeof window === "undefined") return [];
  return safeParse<Trip[]>(localStorage.getItem(TRIPS_KEY), []);
}

export function saveTrips(trips: Trip[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
}

export function loadWaitlist(): WaitlistEntry[] {
  if (typeof window === "undefined") return [];
  return safeParse<WaitlistEntry[]>(localStorage.getItem(WAITLIST_KEY), []);
}

export function saveWaitlistEmail(email: string): void {
  if (typeof window === "undefined") return;
  const list = loadWaitlist();
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  if (list.some((e) => e.email === normalized)) return;
  list.push({ email: normalized, createdAt: new Date().toISOString() });
  localStorage.setItem(WAITLIST_KEY, JSON.stringify(list));
}
