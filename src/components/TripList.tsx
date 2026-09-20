"use client";

import { VEHICLE_RATES } from "@/lib/rates";
import { formatDatePl, formatKm, formatZl } from "@/lib/format";
import type { Trip } from "@/lib/types";

interface Props {
  trips: Trip[];
  onEdit: (trip: Trip) => void;
  onDelete: (id: string) => void;
}

export default function TripList({ trips, onEdit, onDelete }: Props) {
  if (trips.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
        Brak przejazdów. Dodaj pierwszy wpis powyżej.
      </div>
    );
  }

  const sorted = [...trips].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <ul className="divide-y divide-slate-100 sm:hidden">
        {sorted.map((t) => (
          <li key={t.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900">
                  {t.from} → {t.to}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDatePl(t.date)} · {formatKm(t.km)} ·{" "}
                  {VEHICLE_RATES[t.vehicle].short}
                </p>
                <p className="mt-1 text-xs text-slate-600">{t.purpose}</p>
              </div>
              <p className="shrink-0 font-semibold text-slate-900">
                {formatZl(t.amount)}
              </p>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(t)}
                className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"
              >
                Edytuj
              </button>
              <button
                type="button"
                onClick={() => onDelete(t.id)}
                className="rounded-md border border-red-200 px-2.5 py-1 text-xs text-red-700 hover:bg-red-50"
              >
                Usuń
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Trasa</th>
              <th className="px-4 py-3 font-medium">Km</th>
              <th className="px-4 py-3 font-medium">Pojazd</th>
              <th className="px-4 py-3 font-medium">Cel</th>
              <th className="px-4 py-3 font-medium text-right">Kwota</th>
              <th className="px-4 py-3 font-medium text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/60">
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                  {formatDatePl(t.date)}
                </td>
                <td className="px-4 py-3 text-slate-900">
                  {t.from} → {t.to}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                  {formatKm(t.km)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {VEHICLE_RATES[t.vehicle].short}
                </td>
                <td className="max-w-[12rem] truncate px-4 py-3 text-slate-600">
                  {t.purpose}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
                  {formatZl(t.amount)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onEdit(t)}
                    className="mr-2 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Edytuj
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(t.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Usuń
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
