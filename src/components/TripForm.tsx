"use client";

import { FormEvent, useState } from "react";
import { VEHICLE_RATES, calcTripAmount, getRateForDate } from "@/lib/rates";
import { formatZl, todayIsoWarsaw } from "@/lib/format";
import {
  TRIP_DATE_MIN,
  TRIP_KM_MAX,
  tripDateMax,
} from "@/lib/trip-validate";
import type { Trip, VehicleType } from "@/lib/types";

interface Props {
  initial?: Trip | null;
  onSave: (trip: Omit<Trip, "id"> & { id?: string }) => void;
  onCancel?: () => void;
  disabled?: boolean;
  onBlocked?: () => void;
}

const empty = {
  date: "",
  from: "",
  to: "",
  km: "",
  purpose: "",
  vehicle: "samochod_ponad_900" as VehicleType,
};

export default function TripForm({
  initial,
  onSave,
  onCancel,
  disabled,
  onBlocked,
}: Props) {
  const formFor = (t: Trip | null | undefined) =>
    t
      ? {
          date: t.date,
          from: t.from,
          to: t.to,
          km: String(t.km),
          purpose: t.purpose,
          vehicle: t.vehicle,
        }
      : { ...empty, date: todayIsoWarsaw() };
  const [form, setForm] = useState(() => formFor(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Reset the form when the edited trip changes (adjust state during render).
  const [lastInitial, setLastInitial] = useState(initial);
  if (lastInitial !== initial) {
    setLastInitial(initial);
    setForm(formFor(initial));
    setErrors({});
  }

  const kmNum = parseFloat(form.km.replace(",", ".")) || 0;
  // Rate valid on the trip date (versioned table) — same rule as the server.
  const rate = getRateForDate(form.vehicle, form.date || undefined);
  const preview = kmNum > 0 ? calcTripAmount(kmNum, form.vehicle, rate) : 0;

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.date) next.date = "Podaj datę.";
    else if (form.date < TRIP_DATE_MIN || form.date > tripDateMax())
      next.date = `Data musi być z zakresu ${TRIP_DATE_MIN} – ${tripDateMax()}.`;
    if (!form.from.trim()) next.from = "Podaj miejsce wyjazdu.";
    if (!form.to.trim()) next.to = "Podaj miejsce docelowe.";
    if (form.from.trim().length > 200) next.from = "Maksymalnie 200 znaków.";
    if (form.to.trim().length > 200) next.to = "Maksymalnie 200 znaków.";
    if (form.purpose.trim().length > 500) next.purpose = "Cel: maksymalnie 500 znaków.";
    if (!form.km.trim()) {
      next.km = "Podaj liczbę kilometrów.";
    } else if (!/^\d+([.,]\d+)?$/.test(form.km.trim())) {
      next.km = "Wpisz liczbę, np. 12,5 (bez jednostek).";
    } else if (Number.isNaN(kmNum) || kmNum <= 0) {
      next.km = "Kilometry muszą być większe od 0.";
    } else if (Math.round(kmNum * 10) / 10 <= 0) {
      next.km = "Minimum 0,1 km.";
    } else if (kmNum > TRIP_KM_MAX) {
      next.km = "Zbyt duża liczba kilometrów.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (disabled && !initial) {
      onBlocked?.();
      return;
    }
    if (!validate()) return;
    onSave({
      id: initial?.id,
      date: form.date,
      from: form.from.trim(),
      to: form.to.trim(),
      km: Math.round(kmNum * 10) / 10,
      purpose: form.purpose.trim() || "Przejazd służbowy",
      vehicle: form.vehicle,
      amount: calcTripAmount(Math.round(kmNum * 10) / 10, form.vehicle, rate),
      rate,
    });
    if (!initial) {
      setForm({ ...empty, date: todayIsoWarsaw(), vehicle: form.vehicle });
      setErrors({});
    }
  }

  const fieldClass =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400";
  const errClass = "border-red-400 focus:ring-red-300";

  return (
    <form
      onSubmit={submit}
      noValidate
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <h2 className="text-base font-semibold text-slate-900">
        {initial ? "Edytuj przejazd" : "Dodaj przejazd"}
      </h2>
      {disabled && !initial && (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Osiągnięto limit Free w tym miesiącu. Możesz edytować istniejące wpisy
          albo przejść na Premium.
        </p>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4">
        <label className="block text-sm">
          <span className="text-slate-700">Data</span>
          <input
            type="date"
            min={TRIP_DATE_MIN}
            max={tripDateMax()}
            required
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className={`${fieldClass} ${errors.date ? errClass : ""}`}
            aria-invalid={errors.date ? true : undefined}
          />
          {errors.date && (
            <span className="mt-1 block text-xs text-red-600">{errors.date}</span>
          )}
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Pojazd</span>
          <select
            value={form.vehicle}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                vehicle: e.target.value as VehicleType,
              }))
            }
            className={fieldClass}
          >
            {(Object.keys(VEHICLE_RATES) as VehicleType[]).map((k) => (
              <option key={k} value={k}>
                {VEHICLE_RATES[k].label} ({VEHICLE_RATES[k].rate
                  .toFixed(2)
                  .replace(".", ",")}{" "}
                zł/km)
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Skąd</span>
          <input
            required
            value={form.from}
            onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))}
            placeholder="np. Warszawa"
            className={`${fieldClass} ${errors.from ? errClass : ""}`}
            aria-invalid={errors.from ? true : undefined}
          />
          {errors.from && (
            <span className="mt-1 block text-xs text-red-600">{errors.from}</span>
          )}
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Dokąd</span>
          <input
            required
            value={form.to}
            onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
            placeholder="np. Kraków"
            className={`${fieldClass} ${errors.to ? errClass : ""}`}
            aria-invalid={errors.to ? true : undefined}
          />
          {errors.to && (
            <span className="mt-1 block text-xs text-red-600">{errors.to}</span>
          )}
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Kilometry</span>
          <input
            required
            inputMode="decimal"
            value={form.km}
            onChange={(e) => setForm((f) => ({ ...f, km: e.target.value }))}
            placeholder="0"
            className={`${fieldClass} ${errors.km ? errClass : ""}`}
            aria-invalid={errors.km ? true : undefined}
          />
          {errors.km && (
            <span className="mt-1 block text-xs text-red-600">{errors.km}</span>
          )}
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Cel przejazdu</span>
          <input
            value={form.purpose}
            onChange={(e) =>
              setForm((f) => ({ ...f, purpose: e.target.value }))
            }
            placeholder="np. Spotkanie z klientem"
            className={`${fieldClass} ${errors.purpose ? errClass : ""}`}
            aria-invalid={errors.purpose ? true : undefined}
          />
          {errors.purpose && (
            <span className="mt-1 block text-xs text-red-600">{errors.purpose}</span>
          )}
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Kwota:{" "}
          <span className="text-lg font-semibold text-slate-900">
            {formatZl(preview)}
          </span>
          <span className="ml-2 text-xs text-slate-500">
            (stawka {rate.toFixed(2).replace(".", ",")} zł/km wg daty przejazdu)
          </span>
        </p>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              Anuluj
            </button>
          )}
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {initial ? "Zapisz zmiany" : "Dodaj"}
          </button>
        </div>
      </div>
    </form>
  );
}
