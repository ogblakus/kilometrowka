import "server-only";
import { getDb } from "@/lib/db";
import { getRateForDate } from "@/lib/rates";
import { PREMIUM_GRACE_DAYS } from "@/lib/users";
import type { Trip, VehicleType } from "@/lib/types";

/** Hard cap of stored trips per account (Premium has no monthly limit). */
export const MAX_TRIPS_PER_USER = 50_000;
/** Max rows returned by the list endpoint (newest first). */
export const LIST_LIMIT = 5_000;

type TripRow = {
  id: string;
  trip_date: string;
  from_place: string;
  to_place: string;
  km: string | number;
  purpose: string;
  vehicle: string;
  amount_pln: string | number;
  rate_pln_per_km?: string | number | null;
};

const VEHICLES = new Set<VehicleType>([
  "samochod_do_900",
  "samochod_ponad_900",
  "motocykl",
  "motorower",
]);

export function rowToTrip(row: TripRow): Trip {
  const vehicle = VEHICLES.has(row.vehicle as VehicleType)
    ? (row.vehicle as VehicleType)
    : "samochod_ponad_900";
  const date =
    typeof row.trip_date === "string"
      ? row.trip_date.slice(0, 10)
      : String(row.trip_date).slice(0, 10);
  const snap =
    row.rate_pln_per_km === null || row.rate_pln_per_km === undefined
      ? NaN
      : Number(row.rate_pln_per_km);
  return {
    id: row.id,
    date,
    from: row.from_place,
    to: row.to_place,
    km: Number(row.km),
    purpose: row.purpose,
    vehicle,
    amount: Number(row.amount_pln),
    // Legacy rows without a snapshot: rate valid on the trip date.
    rate: Number.isFinite(snap) && snap > 0 ? snap : getRateForDate(vehicle, date),
  };
}

export async function listTrips(clerkUserId: string): Promise<Trip[]> {
  const db = getDb();
  const rows = await db`
    SELECT id, trip_date::text, from_place, to_place, km, purpose, vehicle, amount_pln, rate_pln_per_km
    FROM trips
    WHERE clerk_user_id = ${clerkUserId}
    ORDER BY trip_date DESC, created_at DESC
    LIMIT ${LIST_LIMIT}
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
  rate: number;
};

export type CreateTripResult =
  | { ok: true; trip: Trip }
  | { ok: false; reason: "quota" };


/**
 * Atomically insert a trip, enforcing the Free monthly quota.
 *
 * One READ COMMITTED transaction:
 *  1. per-user advisory lock (serialises concurrent inserts),
 *  2. INSERT … SELECT … WHERE (effective Premium OR trips CREATED this Warsaw
 *     month < limit) AND total rows < MAX_TRIPS_PER_USER,
 *  3. increment trip_quota for the month only if (2) inserted.
 *
 * The quota counts creations in `trip_quota`, not live rows, so deleting a
 * trip does not give the slot back (audit S2).
 */
export async function createTripWithQuota(
  clerkUserId: string,
  input: TripInput,
  freeLimit: number,
  id?: string,
): Promise<CreateTripResult> {
  const db = getDb();
  const tripId = id ?? crypto.randomUUID();
  const results = await db.transaction(
    (tx) => [
      tx`SELECT pg_advisory_xact_lock(hashtextextended(${"trips:" + clerkUserId}, 0))`,
      tx`
      INSERT INTO trips (
        id, clerk_user_id, trip_date, from_place, to_place, km, purpose, vehicle, amount_pln, rate_pln_per_km
      )
      SELECT
        ${tripId}::uuid, ${clerkUserId}, ${input.date}::date, ${input.from}, ${input.to},
        ${input.km}, ${input.purpose}, ${input.vehicle}, ${input.amount}, ${input.rate}
      WHERE
        (
          EXISTS (
            SELECT 1 FROM users
            WHERE clerk_user_id = ${clerkUserId}
              AND plan = 'premium'
              AND (current_period_end IS NULL
                   OR current_period_end > NOW() - make_interval(days => ${PREMIUM_GRACE_DAYS}))
          )
          OR COALESCE((
            SELECT created_count FROM trip_quota
            WHERE clerk_user_id = ${clerkUserId}
              AND month = date_trunc('month', NOW() AT TIME ZONE 'Europe/Warsaw')::date
          ), 0) < ${freeLimit}
        )
        AND (SELECT COUNT(*) FROM trips WHERE clerk_user_id = ${clerkUserId}) < ${MAX_TRIPS_PER_USER}
      RETURNING id, trip_date::text, from_place, to_place, km, purpose, vehicle, amount_pln, rate_pln_per_km
    `,
      tx`
      INSERT INTO trip_quota (clerk_user_id, month, created_count)
      SELECT ${clerkUserId}, date_trunc('month', NOW() AT TIME ZONE 'Europe/Warsaw')::date, 1
      WHERE EXISTS (SELECT 1 FROM trips WHERE id = ${tripId}::uuid AND clerk_user_id = ${clerkUserId})
      ON CONFLICT (clerk_user_id, month)
        DO UPDATE SET created_count = trip_quota.created_count + 1
    `,
    ],
    { isolationLevel: "ReadCommitted" },
  );
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
      rate_pln_per_km = ${input.rate},
      updated_at = NOW()
    WHERE id = ${id}::uuid AND clerk_user_id = ${clerkUserId}
    RETURNING id, trip_date::text, from_place, to_place, km, purpose, vehicle, amount_pln, rate_pln_per_km
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
 * Trips CREATED in the current Europe/Warsaw month (Free quota usage) —
 * read from trip_quota, the same counter createTripWithQuota enforces.
 */
export async function countTripsCreatedThisMonthDb(
  clerkUserId: string,
): Promise<number> {
  const db = getDb();
  const rows = await db`
    SELECT COALESCE((
      SELECT created_count FROM trip_quota
      WHERE clerk_user_id = ${clerkUserId}
        AND month = date_trunc('month', NOW() AT TIME ZONE 'Europe/Warsaw')::date
    ), 0)::int AS c
  `;
  return Number((rows[0] as { c: number } | undefined)?.c ?? 0);
}

/** First day of the month after `YYYY-MM`. */
export function nextMonthStart(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return `${ny}-${String(nm).padStart(2, "0")}-01`;
}

/**
 * Trips for export in chronological order (ewidencja numbering),
 * optionally one trip_date month (YYYY-MM). Uses the (user, trip_date) index.
 */
export async function listTripsForExport(
  clerkUserId: string,
  monthKey?: string,
): Promise<Trip[]> {
  const db = getDb();
  const rows = monthKey
    ? await db`
        SELECT id, trip_date::text, from_place, to_place, km, purpose, vehicle, amount_pln, rate_pln_per_km
        FROM trips
        WHERE clerk_user_id = ${clerkUserId}
          AND trip_date >= ${`${monthKey}-01`}::date
          AND trip_date < ${nextMonthStart(monthKey)}::date
        ORDER BY trip_date ASC, created_at ASC
      `
    : await db`
        SELECT id, trip_date::text, from_place, to_place, km, purpose, vehicle, amount_pln, rate_pln_per_km
        FROM trips
        WHERE clerk_user_id = ${clerkUserId}
        ORDER BY trip_date ASC, created_at ASC
        LIMIT ${MAX_TRIPS_PER_USER}
      `;
  return (rows as TripRow[]).map(rowToTrip);
}
