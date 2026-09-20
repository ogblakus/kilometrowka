"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Disclaimer from "@/components/Disclaimer";
import DietaCalculator from "@/components/DietaCalculator";
import ExportButtons from "@/components/ExportButtons";
import MonthlyTotals from "@/components/MonthlyTotals";
import PaywallModal from "@/components/PaywallModal";
import PremiumUnlock from "@/components/PremiumUnlock";
import Toast from "@/components/Toast";
import TripForm from "@/components/TripForm";
import TripList from "@/components/TripList";
import { formatMonthLabel } from "@/lib/format";
import {
  FREE_TRIPS_PER_MONTH,
  canAddTrip,
  canExportExcel,
  canUseDieta,
  countTripsInMonth,
  currentMonthKey,
  loadPlan,
  type Plan,
} from "@/lib/plan";
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
  const [plan, setPlan] = useState<Plan>("free");
  const [monthFilter, setMonthFilter] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [paywall, setPaywall] = useState<"trips" | "excel" | "dieta" | null>(
    null
  );

  useEffect(() => {
    setTrips(loadTrips());
    setPlan(loadPlan());
    setReady(true);
    const onPlan = () => setPlan(loadPlan());
    window.addEventListener("kilometrowka:plan", onPlan);
    return () => window.removeEventListener("kilometrowka:plan", onPlan);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveTrips(trips);
  }, [trips, ready]);

  const monthOptions = useMemo(() => {
    const keys = new Set(trips.map((t) => t.date.slice(0, 7)));
    keys.add(currentMonthKey());
    return [...keys].sort((a, b) => b.localeCompare(a));
  }, [trips]);

  const filteredTrips = monthFilter
    ? trips.filter((t) => t.date.startsWith(monthFilter))
    : trips;

  const tripsThisMonth = countTripsInMonth(trips, currentMonthKey());
  const addBlocked = !canAddTrip(plan, trips);
  const excelOk = canExportExcel(plan);
  const dietaOk = canUseDieta(plan);

  function handleSave(data: Omit<Trip, "id"> & { id?: string }) {
    if (data.id) {
      setTrips((prev) =>
        prev.map((t) => (t.id === data.id ? ({ ...t, ...data } as Trip) : t))
      );
      setEditing(null);
      setToast("Zapisano zmiany.");
    } else {
      if (!canAddTrip(plan, trips)) {
        setPaywall("trips");
        return;
      }
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
      setToast("Dodano przejazd.");
    }
  }

  function handleDelete(id: string) {
    if (!confirm("Usunąć ten przejazd?")) return;
    setTrips((prev) => prev.filter((t) => t.id !== id));
    if (editing?.id === id) setEditing(null);
    setToast("Usunięto przejazd.");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <Suspense fallback={null}>
        <PremiumUnlock />
      </Suspense>

      <div className="flex flex-wrap items-start justify-between gap-3">
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
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
          <span className="text-slate-500">Plan: </span>
          <strong className="text-slate-900">
            {plan === "premium" ? "Premium" : "Free"}
          </strong>
          {plan === "free" && (
            <>
              <span className="text-slate-400"> · </span>
              <span className="text-slate-600">
                {tripsThisMonth}/{FREE_TRIPS_PER_MONTH} w tym miesiącu
              </span>
              <Link
                href="/kup"
                className="ml-2 font-medium text-slate-900 underline-offset-2 hover:underline"
              >
                Upgrade
              </Link>
            </>
          )}
        </div>
      </div>

      <Disclaimer compact />

      <TripForm
        initial={editing}
        onSave={handleSave}
        onCancel={editing ? () => setEditing(null) : undefined}
        disabled={addBlocked}
        onBlocked={() => setPaywall("trips")}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            Lista przejazdów
          </h2>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="sr-only sm:not-sr-only">Miesiąc</span>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              aria-label="Filtr miesiąca"
            >
              <option value="">Wszystkie</option>
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ExportButtons
          trips={filteredTrips}
          canExcel={excelOk}
          onExcelBlocked={() => setPaywall("excel")}
        />
      </div>

      <TripList
        trips={trips}
        monthFilter={monthFilter}
        onEdit={setEditing}
        onDelete={handleDelete}
      />

      <MonthlyTotals trips={filteredTrips} />

      {dietaOk ? (
        <DietaCalculator />
      ) : (
        <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="pointer-events-none select-none opacity-40 blur-[1px]">
            <DietaCalculator />
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 p-4 backdrop-blur-[2px]">
            <div className="max-w-sm rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <p className="font-semibold text-slate-900">
                Diety krajowe — Premium
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Kalkulator diet (45 zł/doba, ryczałty) jest dostępny w planie
                Premium.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link
                  href="/kup"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Odblokuj
                </Link>
                <button
                  type="button"
                  onClick={() => setPaywall("dieta")}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Więcej info
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {paywall && (
        <PaywallModal reason={paywall} onClose={() => setPaywall(null)} />
      )}
    </div>
  );
}
