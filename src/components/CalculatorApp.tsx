"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Disclaimer from "@/components/Disclaimer";
import DietaPremiumGate from "@/components/DietaPremiumGate";
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
  const isPremium = plan === "premium";

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
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:py-8">
      <Suspense fallback={null}>
        <PremiumUnlock />
      </Suspense>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Ewidencja kilometrówki
            </h1>
            {isPremium && (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                Premium aktywne
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
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
        <div
          className={`rounded-lg border px-3 py-2 text-sm shadow-sm ${
            isPremium
              ? "border-emerald-200 bg-emerald-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <span className="text-slate-500">Plan: </span>
          <strong className={isPremium ? "text-emerald-900" : "text-slate-900"}>
            {isPremium ? "Premium" : "Free"}
          </strong>
          {!isPremium && (
            <>
              <span className="text-slate-400"> · </span>
              <span className="text-slate-600">
                {tripsThisMonth}/{FREE_TRIPS_PER_MONTH} w tym miesiącu
              </span>
              <Link
                href="/kup"
                className="ml-2 font-medium text-slate-900 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded"
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

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            Lista przejazdów
          </h2>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="sr-only sm:not-sr-only">Miesiąc</span>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="min-h-10 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
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

      <DietaPremiumGate
        unlocked={dietaOk}
        onMoreInfo={() => setPaywall("dieta")}
      />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {paywall && (
        <PaywallModal reason={paywall} onClose={() => setPaywall(null)} />
      )}
    </div>
  );
}
