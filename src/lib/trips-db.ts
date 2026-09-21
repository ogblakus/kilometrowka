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

export async function createTrip(
  clerkUserId: string,
  input: TripInput,
  id?: string,
): Promise<Trip> {
  const db = getDb();
  const rows = id
    ? await db`
        INSERT INTO trips (
          id, clerk_user_id, trip_date, from_place, to_place, km, purpose, vehicle, amount_pln
        ) VALUES (
          ${id}::uuid, ${clerkUserId}, ${input.date}::date, ${input.from}, ${input.to},
          ${input.km}, ${input.purpose}, ${input.vehicle}, ${input.amount}
        )
        RETURNING id, trip_date::text, from_place, to_place, km, purpose, vehicle, amount_pln
      `
    : await db`
        INSERT INTO trips (
          clerk_user_id, trip_date, from_place, to_place, km, purpose, vehicle, amount_pln
        ) VALUES (
          ${clerkUserId}, ${input.date}::date, ${input.from}, ${input.to},
          ${input.km}, ${input.purpose}, ${input.vehicle}, ${input.amount}
        )
        RETURNING id, trip_date::text, from_place, to_place, km, purpose, vehicle, amount_pln
      `;
  return rowToTrip(rows[0] as TripRow);
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
