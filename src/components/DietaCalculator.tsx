"use client";

import { useEffect, useMemo, useState } from "react";
import type { DietaResult } from "@/lib/dieta";
import {
  validateDietaInput,
  type DietaFieldErrors,
} from "@/lib/dieta-validate";
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

  // Inline validation runs locally; the amount is computed server-side
  // (Premium-gated /api/dieta, audit S3).
  const validation = useMemo(() => validateDietaInput(input), [input]);
  const errors: DietaFieldErrors = "errors" in validation ? validation.errors : {};
  const valid = !("errors" in validation);
  const [result, setResult] = useState<DietaResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!valid) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      fetch("/api/dieta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: ctrl.signal,
      })
        .then(async (res) => {
          const data = (await res.json().catch(() => ({}))) as {
            result?: DietaResult;
            error?: string;
          };
          if (!res.ok || !data.result) {
            setResult(null);
            setServerError(data.error || "Nie udało się obliczyć diety.");
            return;
          }
          setServerError(null);
          setResult(data.result);
        })
        .catch((e: unknown) => {
          if ((e as { name?: string })?.name === "AbortError") return;
          setResult(null);
          setServerError("Brak połączenia — spróbuj ponownie.");
        })
        .finally(() => setLoading(false));
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [input, valid]);

  const errCls = "border-red-400";
  const errText = (msg?: string) =>
    msg ? <span className="mt-1 block text-xs text-red-600">{msg}</span> : null;

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
            aria-invalid={errors.startDate ? true : undefined}
            className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400 ${errors.startDate ? errCls : ""}`}
          />
          {errText(errors.startDate)}
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Początek — godzina</span>
          <input
            type="time"
            value={input.startTime}
            onChange={(e) =>
              setInput((i) => ({ ...i, startTime: e.target.value }))
            }
            aria-invalid={errors.startTime ? true : undefined}
            className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400 ${errors.startTime ? errCls : ""}`}
          />
          {errText(errors.startTime)}
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Koniec — data</span>
          <input
            type="date"
            value={input.endDate}
            onChange={(e) =>
              setInput((i) => ({ ...i, endDate: e.target.value }))
            }
            aria-invalid={errors.endDate ? true : undefined}
            className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400 ${errors.endDate ? errCls : ""}`}
          />
          {errText(errors.endDate)}
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Koniec — godzina</span>
          <input
            type="time"
            value={input.endTime}
            onChange={(e) =>
              setInput((i) => ({ ...i, endTime: e.target.value }))
            }
            aria-invalid={errors.endTime ? true : undefined}
            className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400 ${errors.endTime ? errCls : ""}`}
          />
          {errText(errors.endTime)}
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
        {errText(errors.meals)}
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

      {!valid ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {errors.end || "Popraw zaznaczone pola."}
        </p>
      ) : serverError ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {serverError}
        </p>
      ) : result ? (
        <div className="mt-4 rounded-lg bg-slate-50 p-4" aria-busy={loading}>
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
            {loading && (
              <span className="ml-2 text-xs font-normal text-slate-400">
                przeliczam…
              </span>
            )}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Obliczam…</p>
      )}

      <div className="mt-4">
        <DietaDisclaimer />
      </div>
    </section>
  );
}
