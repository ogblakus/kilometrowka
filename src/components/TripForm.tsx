"use client";

import { FormEvent, useEffect, useState } from "react";
import { VEHICLE_RATES, calcTripAmount } from "@/lib/rates";
import { formatZl, todayIsoWarsaw } from "@/lib/format";
import type { Trip, VehicleType } from "@/lib/types";

interface Props {
  initial?: Trip | null;
  onSave: (trip: Omit<Trip, "id"> & { id?: string }) => void;
  onCancel?: () => void;
}

const empty = {
  date: "",
  from: "",
  to: "",
  km: "",
  purpose: "",
  vehicle: "samochod_ponad_900" as VehicleType,
};

export default function TripForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (initial) {
      setForm({
        date: initial.date,
        from: initial.from,
        to: initial.to,
        km: String(initial.km),
        purpose: initial.purpose,
        vehicle: initial.vehicle,
      });
    } else {
      setForm({ ...empty, date: todayIsoWarsaw() });
    }
  }, [initial]);

  const kmNum = parseFloat(form.km.replace(",", ".")) || 0;
  const preview = kmNum > 0 ? calcTripAmount(kmNum, form.vehicle) : 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.date || !form.from.trim() || !form.to.trim() || kmNum <= 0) return;
    onSave({
      id: initial?.id,
      date: form.date,
      from: form.from.trim(),
      to: form.to.trim(),
      km: Math.round(kmNum * 10) / 10,
      purpose: form.purpose.trim() || "Przejazd służbowy",
      vehicle: form.vehicle,
      amount: calcTripAmount(kmNum, form.vehicle),
    });
    if (!initial) {
      setForm({ ...empty, date: todayIsoWarsaw(), vehicle: form.vehicle });
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h2 className="text-base font-semibold text-slate-900">
        {initial ? "Edytuj przejazd" : "Dodaj przejazd"}
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-600">Data</span>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Pojazd</span>
          <select
            value={form.vehicle}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                vehicle: e.target.value as VehicleType,
              }))
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
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
          <span className="text-slate-600">Skąd</span>
          <input
            required
            value={form.from}
            onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))}
            placeholder="np. Warszawa"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Dokąd</span>
          <input
            required
            value={form.to}
            onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
            placeholder="np. Kraków"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Kilometry</span>
          <input
            required
            inputMode="decimal"
            value={form.km}
            onChange={(e) => setForm((f) => ({ ...f, km: e.target.value }))}
            placeholder="0"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Cel przejazdu</span>
          <input
            value={form.purpose}
            onChange={(e) =>
              setForm((f) => ({ ...f, purpose: e.target.value }))
            }
            placeholder="np. Spotkanie z klientem"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Kwota:{" "}
          <span className="text-lg font-semibold text-slate-900">
            {formatZl(preview)}
          </span>
        </p>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Anuluj
            </button>
          )}
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {initial ? "Zapisz zmiany" : "Dodaj"}
          </button>
        </div>
      </div>
    </form>
  );
}
