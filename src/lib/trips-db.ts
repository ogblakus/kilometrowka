import "server-only";
import { getDb } from "@/lib/db";
import type { Trip, VehicleType } from "@/lib/types";

type TripRow = {
  id: string;
  trip_date: string;
  from_place: string;
  to_place: string;
  km: string | number;
  purpose: string;
  vehicle: string;
  amount_pln: string | number;
};

const VEHICLES = new Set<VehicleType>([
  "samochod_do_900",
  "samochod_ponad_900",
  "motocykl",
  "motorower",
]);

function rowToTrip(row: TripRow): Trip {
  const vehicle = VEHICLES.has(row.vehicle as VehicleType)
    ? (row.vehicle as VehicleType)
    : "samochod_ponad_900";
  return {
    id: row.id,
    date:
      typeof row.trip_date === "string"
        ? row.trip_date.slice(0, 10)
        : String(row.trip_date).slice(0, 10),
    from: row.from_place,
    to: row.to_place,
    km: Number(row.km),
    purpose: row.purpose,
    vehicle,
    amount: Number(row.amount_pln),
  };
}

export async function listTrips(clerkUserId: string): Promise<Trip[]> {
  const db = getDb();
  const rows = await db`
    SELECT id, trip_date::text, from_place, to_place, km, purpose, vehicle, amount_pln
    FROM trips
    WHERE clerk_user_id = ${clerkUserId}
    ORDER BY trip_date DESC, created_at DESC
  `;
  return (rows as TripRow[]).map(rowToTrip);
}

export type TripInput = {
  date: string;
  from: string;
  to: string;
  km: number;
  purpose: string;
  vehicle: VehicleType;
  amount: number;
};

export type CreateTripResult =
  | { ok: true; trip: Trip }
  | { ok: false; reason: "quota" };

/**
 * Atomically insert a trip, enforcing the Free monthly quota.
 *
 * Runs as one transaction: a per-user advisory lock serialises concurrent
 * inserts for the same user, then a single INSERT … SELECT … WHERE inserts
 * only if the user is Premium (read from Neon inside the same statement) or
 * has created fewer than `freeLimit` trips in the current Warsaw calendar
 * month. Under READ COMMITTED the INSERT takes a fresh snapshot after the
 * lock, so it sees rows committed by the previous lock holder.
 */
export async function createTripWithQuota(
  clerkUserId: string,
  input: TripInput,
  freeLimit: number,
  id?: string,
): Promise<CreateTripResult> {
  const db = getDb();
  const tripId = id ?? crypto.randomUUID();
  const results = await db.transaction((tx) => [
    tx`SELECT pg_advisory_xact_lock(hashtextextended(${"trips:" + clerkUserId}, 0))`,
    tx`
      INSERT INTO trips (
        id, clerk_user_id, trip_date, from_place, to_place, km, purpose, vehicle, amount_pln
      )
      SELECT
        ${tripId}::uuid, ${clerkUserId}, ${input.date}::date, ${input.from}, ${input.to},
        ${input.km}, ${input.purpose}, ${input.vehicle}, ${input.amount}
      WHERE
        COALESCE(
          (SELECT plan FROM users WHERE clerk_user_id = ${clerkUserId}),
          'free'
        ) = 'premium'
        OR (
          SELECT COUNT(*)
          FROM trips
          WHERE clerk_user_id = ${clerkUserId}
            AND created_at >= (
              date_trunc('month', NOW() AT TIME ZONE 'Europe/Warsaw')
              AT TIME ZONE 'Europe/Warsaw'
            )
        ) < ${freeLimit}
      RETURNING id, trip_date::text, from_place, to_place, km, purpose, vehicle, amount_pln
    `,
  ], { isolationLevel: "ReadCommitted" });
  const rows = results[1] as TripRow[];
  if (!rows[0]) return { ok: false, reason: "quota" };
  return { ok: true, trip: rowToTrip(rows[0]) };
}

export async function updateTrip(
  clerkUserId: string,
  id: string,
  input: TripInput,
): Promise<Trip | null> {
  const db = getDb();
  const rows = await db`
    UPDATE trips SET
      trip_date = ${input.date}::date,
      from_place = ${input.from},
      to_place = ${input.to},
      km = ${input.km},
      purpose = ${input.purpose},
      vehicle = ${input.vehicle},
      amount_pln = ${input.amount},
      updated_at = NOW()
    WHERE id = ${id}::uuid AND clerk_user_id = ${clerkUserId}
    RETURNING id, trip_date::text, from_place, to_place, km, purpose, vehicle, amount_pln
  `;
  if (!rows[0]) return null;
  return rowToTrip(rows[0] as TripRow);
}

export async function deleteTrip(
  clerkUserId: string,
  id: string,
): Promise<boolean> {
  const db = getDb();
  const rows = await db`
    DELETE FROM trips
    WHERE id = ${id}::uuid AND clerk_user_id = ${clerkUserId}
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * Count trips CREATED (created_at) in the current Europe/Warsaw calendar
 * month — the same rule createTripWithQuota enforces.
 */
export async function countTripsCreatedThisMonthDb(
  clerkUserId: string,
): Promise<number> {
  const db = getDb();
  const rows = await db`
    SELECT COUNT(*)::int AS c
    FROM trips
    WHERE clerk_user_id = ${clerkUserId}
      AND created_at >= (
        date_trunc('month', NOW() AT TIME ZONE 'Europe/Warsaw')
        AT TIME ZONE 'Europe/Warsaw'
      )
  `;
  return Number((rows[0] as { c: number } | undefined)?.c ?? 0);
}

/** Trips for export, optionally limited to one trip_date month (YYYY-MM). */
export async function listTripsForExport(
  clerkUserId: string,
  monthKey?: string,
): Promise<Trip[]> {
  if (!monthKey) return listTrips(clerkUserId);
  const db = getDb();
  const rows = await db`
    SELECT id, trip_date::text, from_place, to_place, km, purpose, vehicle, amount_pln
    FROM trips
    WHERE clerk_user_id = ${clerkUserId}
      AND to_char(trip_date, 'YYYY-MM') = ${monthKey}
    ORDER BY trip_date DESC, created_at DESC
  `;
  return (rows as TripRow[]).map(rowToTrip);
}
