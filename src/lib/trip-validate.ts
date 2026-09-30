import { calcTripAmount } from "@/lib/rates";
import type { VehicleType } from "@/lib/types";

const VEHICLES = new Set<VehicleType>([
  "samochod_do_900",
  "samochod_ponad_900",
  "motocykl",
  "motorower",
]);

export const TRIP_FROM_MAX = 200;
export const TRIP_TO_MAX = 200;
export const TRIP_PURPOSE_MAX = 500;
export const TRIP_KM_MAX = 1_000_000;
/** Earliest accepted trip date (inclusive). */
export const TRIP_DATE_MIN = "2000-01-01";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True for a canonical 8-4-4-4-12 hex UUID (any version). */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** Today's date in Europe/Warsaw as YYYY-MM-DD. */
export function todayWarsawIso(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Latest accepted trip date (inclusive): today (Warsaw) + 1 year. */
export function tripDateMax(now: Date = new Date()): string {
  const [y, m, d] = todayWarsawIso(now).split("-").map(Number);
  // Feb 29 + 1 year → Feb 28
  const dt = new Date(Date.UTC(y + 1, m - 1, d));
  if (dt.getUTCMonth() !== m - 1) dt.setUTCDate(0);
  return dt.toISOString().slice(0, 10);
}

/** YYYY-MM-DD strings compare lexicographically. */
export function isTripDateInRange(date: string, now: Date = new Date()): boolean {
  return date >= TRIP_DATE_MIN && date <= tripDateMax(now);
}

export type ValidatedTripInput = {
  date: string;
  from: string;
  to: string;
  km: number;
  purpose: string;
  vehicle: VehicleType;
  amount: number;
};

function isValidIsoDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/**
 * Validate TripInput from an API body.
 * Recalculates amount = distance × rate server-side; ignores client amount.
 */
export function parseAndValidateTripBody(
  body: unknown,
  now: Date = new Date(),
): ValidatedTripInput | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Nieprawidłowy JSON." };
  }
  const b = body as Record<string, unknown>;
  const date = typeof b.date === "string" ? b.date.trim() : "";
  const from = typeof b.from === "string" ? b.from.trim() : "";
  const to = typeof b.to === "string" ? b.to.trim() : "";
  const purposeRaw = typeof b.purpose === "string" ? b.purpose.trim() : "";
  const vehicle = b.vehicle as VehicleType;
  const km = typeof b.km === "number" ? b.km : Number(b.km);

  if (!isValidIsoDate(date)) {
    return { error: "Nieprawidłowa data." };
  }
  if (!isTripDateInRange(date, now)) {
    return {
      error: `Data musi być z zakresu ${TRIP_DATE_MIN} – ${tripDateMax(now)}.`,
    };
  }
  if (!from || !to) {
    return { error: "Wymagane pola from i to." };
  }
  if (from.length > TRIP_FROM_MAX || to.length > TRIP_TO_MAX) {
    return { error: "Zbyt długa nazwa miejsca." };
  }
  if (purposeRaw.length > TRIP_PURPOSE_MAX) {
    return { error: "Zbyt długi cel przejazdu." };
  }
  // finite + non-negative; business: distance must be > 0
  if (!Number.isFinite(km) || km < 0) {
    return { error: "Nieprawidłowe km." };
  }
  if (km <= 0 || km > TRIP_KM_MAX) {
    return { error: "Nieprawidłowe km." };
  }
  if (!VEHICLES.has(vehicle)) {
    return { error: "Nieprawidłowy pojazd." };
  }

  const kmRounded = Math.round(km * 10) / 10;
  // Validate after rounding: e.g. 0.04 km rounds to 0 and would violate the DB CHECK
  if (kmRounded <= 0 || kmRounded > TRIP_KM_MAX) {
    return { error: "Nieprawidłowe km (minimum 0,1 km)." };
  }
  const purpose = purposeRaw || "—";
  // Ignore client amount — always recompute on server
  const amount = calcTripAmount(kmRounded, vehicle);

  return {
    date,
    from,
    to,
    km: kmRounded,
    purpose,
    vehicle,
    amount,
  };
}
