import type { Plan } from "@/lib/plan";
import { isUuid } from "@/lib/trip-validate";
import type { Trip } from "@/lib/types";

export type CloudMe = {
  plan: Plan;
  /** Trips created this Warsaw month (Free quota usage); null if unknown. */
  tripsThisMonth: number | null;
};

/**
 * Load plan + quota usage from Neon via /api/me (Clerk session).
 * This is the ONLY source of plan for signed-in users — nothing is cached
 * in or read from localStorage.
 */
export async function fetchCloudMe(): Promise<CloudMe | null> {
  try {
    const res = await fetch("/api/me", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      plan?: Plan;
      tripsThisMonth?: number | null;
    };
    if (data.plan === "premium" || data.plan === "free") {
      return {
        plan: data.plan,
        tripsThisMonth:
          typeof data.tripsThisMonth === "number" ? data.tripsThisMonth : null,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function fetchCloudTrips(): Promise<Trip[] | null> {
  try {
    const res = await fetch("/api/trips");
    if (!res.ok) return null;
    const data = (await res.json()) as { trips?: Trip[] };
    return Array.isArray(data.trips) ? data.trips : [];
  } catch {
    return null;
  }
}

export type PostTripResult =
  | { ok: true; trip: Trip }
  | { ok: false; code?: string; error?: string };

export async function postCloudTrip(
  data: Omit<Trip, "id"> & { id?: string },
): Promise<PostTripResult> {
  try {
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Server accepts only UUID ids (legacy local ids are dropped)
        id: isUuid(data.id) ? data.id : undefined,
        date: data.date,
        from: data.from,
        to: data.to,
        km: data.km,
        purpose: data.purpose,
        vehicle: data.vehicle,
        amount: data.amount,
      }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as {
        code?: string;
        error?: string;
      };
      return { ok: false, code: err.code, error: err.error };
    }
    const json = (await res.json()) as { trip: Trip };
    return { ok: true, trip: json.trip };
  } catch {
    return { ok: false };
  }
}

export async function patchCloudTrip(
  id: string,
  data: Omit<Trip, "id">,
): Promise<Trip | null> {
  try {
    const res = await fetch(`/api/trips/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: data.date,
        from: data.from,
        to: data.to,
        km: data.km,
        purpose: data.purpose,
        vehicle: data.vehicle,
        amount: data.amount,
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { trip: Trip };
    return json.trip;
  } catch {
    return null;
  }
}

export async function deleteCloudTrip(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/trips/${id}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}
