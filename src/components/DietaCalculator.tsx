"use client";

import { useMemo, useState } from "react";
import { calcDieta } from "@/lib/dieta";
import {
  DIETA_DOBOWA,
  DIETA_DOJAZDY_RYCZALT,
  DIETA_NOCLEG_RYCZALT,
} from "@/lib/rates";
import { formatZl, todayIsoWarsaw } from "@/lib/format";
import type { DietaInput } from "@/lib/types";

export default function DietaCalculator() {
  const today = todayIsoWarsaw();
  const [input, setInput] = useState<DietaInput>({
    startDate: today,
    startTime: "08:00",
    endDate: today,
    endTime: "18:00",
    includeNocleg: false,
    includeDojazdy: false,
  });

  const result = useMemo(() => calcDieta(input), [input]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Kalkulator diety krajowej
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Dieta {DIETA_DOBOWA} zł/doba · ryczałt nocleg{" "}
            {DIETA_NOCLEG_RYCZALT.toFixed(2).replace(".", ",")} zł · dojazdy{" "}
            {DIETA_DOJAZDY_RYCZALT.toFixed(2).replace(".", ",")} zł. Projekt 60
            zł/doba nie jest obowiązującym prawem.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-600">Początek — data</span>
          <input
            type="date"
            value={input.startDate}
            onChange={(e) =>
              setInput((i) => ({ ...i, startDate: e.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Początek — godzina</span>
          <input
            type="time"
            value={input.startTime}
            onChange={(e) =>
              setInput((i) => ({ ...i, startTime: e.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Koniec — data</span>
          <input
            type="date"
            value={input.endDate}
            onChange={(e) =>
              setInput((i) => ({ ...i, endDate: e.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Koniec — godzina</span>
          <input
            type="time"
            value={input.endTime}
            onChange={(e) =>
              setInput((i) => ({ ...i, endTime: e.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <label className="inline-flex items-center gap-2 text-slate-700">
          <input
            type="checkbox"
            checked={input.includeNocleg}
            onChange={(e) =>
              setInput((i) => ({ ...i, includeNocleg: e.target.checked }))
            }
            className="rounded border-slate-300"
          />
          Ryczałt za nocleg ({DIETA_NOCLEG_RYCZALT.toFixed(2).replace(".", ",")}{" "}
          zł)
        </label>
        <label className="inline-flex items-center gap-2 text-slate-700">
          <input
            type="checkbox"
            checked={input.includeDojazdy}
            onChange={(e) =>
              setInput((i) => ({ ...i, includeDojazdy: e.target.checked }))
            }
            className="rounded border-slate-300"
          />
          Ryczałt dojazdów ({DIETA_DOJAZDY_RYCZALT.toFixed(2).replace(".", ",")}{" "}
          zł × 2)
        </label>
      </div>

      {result ? (
        <div className="mt-4 rounded-lg bg-slate-50 p-4">
          <p className="text-sm text-slate-600">
            Czas podróży:{" "}
            <strong>
              {result.totalHours.toFixed(1).replace(".", ",")} h
            </strong>
          </p>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {result.breakdown.map((line) => (
              <li key={line}>• {line}</li>
            ))}
          </ul>
          <p className="mt-3 text-lg font-semibold text-slate-900">
            Razem: {formatZl(result.total)}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-red-600">
          Sprawdź daty i godziny — koniec musi być później niż początek.
        </p>
      )}
    </section>
  );
}
