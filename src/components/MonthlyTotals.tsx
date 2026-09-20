"use client";

import { formatKm, formatMonthLabel, formatZl } from "@/lib/format";
import type { Trip } from "@/lib/types";

interface Props {
  trips: Trip[];
}

export default function MonthlyTotals({ trips }: Props) {
  const byMonth = new Map<string, { km: number; amount: number; count: number }>();

  for (const t of trips) {
    const key = t.date.slice(0, 7);
    const cur = byMonth.get(key) ?? { km: 0, amount: 0, count: 0 };
    cur.km += t.km;
    cur.amount += t.amount;
    cur.count += 1;
    byMonth.set(key, cur);
  }

  const months = [...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  const grandKm = trips.reduce((s, t) => s + t.km, 0);
  const grandAmount = trips.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Podsumowanie</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Przejazdy</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {trips.length}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Kilometry</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatKm(grandKm)}
          </p>
        </div>
        <div className="rounded-lg bg-slate-900 p-3 text-white">
          <p className="text-xs text-slate-300">Suma kilometrówki</p>
          <p className="mt-1 text-xl font-semibold">{formatZl(grandAmount)}</p>
        </div>
      </div>

      {months.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Miesiąc</th>
                <th className="px-3 py-2 text-right font-medium">Wpisy</th>
                <th className="px-3 py-2 text-right font-medium">Km</th>
                <th className="px-3 py-2 text-right font-medium">Kwota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {months.map(([key, v]) => (
                <tr key={key}>
                  <td className="px-3 py-2 capitalize text-slate-800">
                    {formatMonthLabel(key)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-600">
                    {v.count}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-600">
                    {formatKm(v.km)}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-slate-900">
                    {formatZl(v.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
