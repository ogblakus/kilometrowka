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
