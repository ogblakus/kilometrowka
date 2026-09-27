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
import { DietaDisclaimer } from "@/components/Disclaimer";

type MealKey = "breakfasts" | "lunches" | "dinners";

const MEALS: { key: MealKey; label: string; hint: string }[] = [
  { key: "breakfasts", label: "Śniadania", hint: "−25% diety" },
  { key: "lunches", label: "Obiady", hint: "−50% diety" },
  { key: "dinners", label: "Kolacje", hint: "−25% diety" },
];

function toMealCount(value: string): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export default function DietaCalculator() {
  const today = todayIsoWarsaw();
  const [input, setInput] = useState<DietaInput>({
    startDate: today,
    startTime: "08:00",
    endDate: today,
    endTime: "18:00",
    includeNocleg: false,
    includeDojazdy: false,
    breakfasts: 0,
    lunches: 0,
    dinners: 0,
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
            Dieta {DIETA_DOBOWA} zł/doba · ryczałt za nocleg{" "}
            {DIETA_NOCLEG_RYCZALT.toFixed(2).replace(".", ",")} zł/noc · dojazdy{" "}
            {DIETA_DOJAZDY_RYCZALT.toFixed(2).replace(".", ",")} zł/rozpoczęta
            doba. Projekt 60 zł/doba nie jest obowiązującym prawem.
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

      <fieldset className="mt-4">
        <legend className="text-sm text-slate-600">
          Zapewnione bezpłatne posiłki (zmniejszają dietę)
        </legend>
        <div className="mt-1 grid grid-cols-3 gap-3">
          {MEALS.map((meal) => (
            <label key={meal.key} className="block text-sm">
              <span className="text-slate-600">
                {meal.label}{" "}
                <span className="text-xs text-slate-400">({meal.hint})</span>
              </span>
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={input[meal.key] ?? 0}
                onChange={(e) =>
                  setInput((i) => ({
                    ...i,
                    [meal.key]: toMealCount(e.target.value),
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-3 flex flex-col gap-2 text-sm">
        <label className="inline-flex items-start gap-2 text-slate-700">
          <input
            type="checkbox"
            checked={input.includeNocleg}
            onChange={(e) =>
              setInput((i) => ({ ...i, includeNocleg: e.target.checked }))
            }
            className="mt-0.5 rounded border-slate-300"
          />
          <span>
            Ryczałt za nocleg bez rachunku (
            {DIETA_NOCLEG_RYCZALT.toFixed(2).replace(".", ",")} zł/noc)
            <span className="block text-xs text-slate-500">
              Za każdą noc, w której podróż obejmuje min. 6 h między 21:00 a
              7:00. Nie przysługuje, gdy nocleg był zapewniony lub masz
              rachunek.
            </span>
          </span>
        </label>
        <label className="inline-flex items-start gap-2 text-slate-700">
          <input
            type="checkbox"
            checked={input.includeDojazdy}
            onChange={(e) =>
              setInput((i) => ({ ...i, includeDojazdy: e.target.checked }))
            }
            className="mt-0.5 rounded border-slate-300"
          />
          <span>
            Ryczałt na dojazdy komunikacją miejscową (
            {DIETA_DOJAZDY_RYCZALT.toFixed(2).replace(".", ",")} zł/rozpoczęta
            doba)
            <span className="block text-xs text-slate-500">
              Nie przysługuje, jeśli nie ponosisz tych kosztów (np. poruszasz
              się własnym autem).
            </span>
          </span>
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

      <div className="mt-4">
        <DietaDisclaimer />
      </div>
    </section>
  );
}
