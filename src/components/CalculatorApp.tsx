"use client";

import { useEffect, useState } from "react";
import Disclaimer from "@/components/Disclaimer";
import DietaCalculator from "@/components/DietaCalculator";
import ExportButtons from "@/components/ExportButtons";
import MonthlyTotals from "@/components/MonthlyTotals";
import TripForm from "@/components/TripForm";
import TripList from "@/components/TripList";
import { KILOMETROWKA_YEAR, VEHICLE_RATES } from "@/lib/rates";
import { loadTrips, saveTrips } from "@/lib/storage";
import type { Trip } from "@/lib/types";

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function CalculatorApp() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);

  useEffect(() => {
    setTrips(loadTrips());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveTrips(trips);
  }, [trips, ready]);

  function handleSave(data: Omit<Trip, "id"> & { id?: string }) {
    if (data.id) {
      setTrips((prev) =>
        prev.map((t) => (t.id === data.id ? ({ ...t, ...data } as Trip) : t))
      );
      setEditing(null);
    } else {
      const trip: Trip = {
        id: newId(),
        date: data.date,
        from: data.from,
        to: data.to,
        km: data.km,
        purpose: data.purpose,
        vehicle: data.vehicle,
        amount: data.amount,
      };
      setTrips((prev) => [trip, ...prev]);
    }
  }

  function handleDelete(id: string) {
    if (!confirm("Usunąć ten przejazd?")) return;
    setTrips((prev) => prev.filter((t) => t.id !== id));
    if (editing?.id === id) setEditing(null);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Ewidencja kilometrówki
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Stawki {KILOMETROWKA_YEAR}: auto ≤900 cm³{" "}
          {VEHICLE_RATES.samochod_do_900.rate.toFixed(2).replace(".", ",")}{" "}
          zł/km · auto &gt;900 cm³{" "}
          {VEHICLE_RATES.samochod_ponad_900.rate
            .toFixed(2)
            .replace(".", ",")}{" "}
          zł/km · motocykl{" "}
          {VEHICLE_RATES.motocykl.rate.toFixed(2).replace(".", ",")} zł/km ·
          motorower{" "}
          {VEHICLE_RATES.motorower.rate.toFixed(2).replace(".", ",")} zł/km
          (Dz.U. 2023 poz. 5). Dane w localStorage tej przeglądarki.
        </p>
      </div>

      <Disclaimer compact />

      <TripForm
        initial={editing}
        onSave={handleSave}
        onCancel={editing ? () => setEditing(null) : undefined}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">
          Lista przejazdów
        </h2>
        <ExportButtons trips={trips} />
      </div>

      <TripList
        trips={trips}
        onEdit={setEditing}
        onDelete={handleDelete}
      />

      <MonthlyTotals trips={trips} />

      <DietaCalculator />
    </div>
  );
}
