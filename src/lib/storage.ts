import { EMPTY_PROFILE, type EwidencjaProfile, type Trip } from "./types";

const TRIPS_KEY = "kilometrowka.app.trips.v1";
const PROFILE_KEY = "kilometrowka.app.profile.v1";
const LEGACY_WAITLIST_KEY = "kilometrowka.app.waitlist.v1";

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

/** Guest-mode ewidencja profile (kept only in this browser). */
export function loadLocalProfile(): EwidencjaProfile {
  if (typeof window === "undefined") return EMPTY_PROFILE;
  return { ...EMPTY_PROFILE, ...safeParse<Partial<EwidencjaProfile>>(localStorage.getItem(PROFILE_KEY), {}) };
}

export function saveLocalProfile(p: EwidencjaProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

/** Remove the legacy local "waitlist" (e-mails were never sent anywhere). */
export function clearLegacyWaitlist(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LEGACY_WAITLIST_KEY);
  } catch {
    /* ignore */
  }
}
