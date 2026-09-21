import type { Plan } from "@/lib/plan";
import type { Trip } from "@/lib/types";

const PLAN_KEY = "kilometrowka.app.plan.v1";

/**
 * Load plan from Neon via /api/me (Clerk session).
 * Caches into localStorage; signed-in UI must use the returned value as source of truth.
 * Does not dispatch kilometrowka:plan (avoids refresh loops).
 */
export async function fetchCloudPlan(): Promise<Plan | null> {
  try {
    const res = await fetch("/api/me");
    if (!res.ok) return null;
    const data = (await res.json()) as { plan?: Plan };
    if (data.plan === "premium" || data.plan === "free") {
      if (typeof window !== "undefined") {
        localStorage.setItem(PLAN_KEY, data.plan);
      }
      return data.plan;
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

export async function postCloudTrip(
  data: Omit<Trip, "id"> & { id?: string },
): Promise<Trip | null> {
  try {
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: data.id,
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
