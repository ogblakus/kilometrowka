import type { DietaInput } from "./types";

const MIN_PER_DAY = 24 * 60;

/**
 * Zamienia datę i godzinę na minuty „zegarowe” (bez stref czasowych i zmiany
 * czasu letni/zimowy), żeby wynik nie zależał od strefy przeglądarki.
 */
export function toWallClockMinutes(date: string, time: string): number | null {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const tm = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(time);
  if (!dm || !tm) return null;
  const y = Number(dm[1]);
  const mo = Number(dm[2]);
  const d = Number(dm[3]);
  const hh = Number(tm[1]);
  const mm = Number(tm[2]);
  if (hh > 23 || mm > 59) return null;
  const ms = Date.UTC(y, mo - 1, d, hh, mm);
  const check = new Date(ms);
  if (
    check.getUTCFullYear() !== y ||
    check.getUTCMonth() !== mo - 1 ||
    check.getUTCDate() !== d
  ) {
    return null;
  }
  return Math.round(ms / 60000);
}


/** Max trip length accepted by the calculator (days). */
export const DIETA_MAX_DAYS = 90;
export const DIETA_MAX_MEALS = 300;

export type DietaFieldErrors = Partial<
  Record<"startDate" | "startTime" | "endDate" | "endTime" | "end" | "meals", string>
>;

/**
 * Field-level validation shared by the form (inline messages) and the
 * /api/dieta route. Returns the normalised input or per-field errors.
 */
export function validateDietaInput(
  body: unknown,
): DietaInput | { errors: DietaFieldErrors } {
  const errors: DietaFieldErrors = {};
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const startDate = s(b.startDate);
  const startTime = s(b.startTime);
  const endDate = s(b.endDate);
  const endTime = s(b.endTime);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) errors.startDate = "Podaj datę rozpoczęcia podróży.";
  if (!/^\d{2}:\d{2}$/.test(startTime)) errors.startTime = "Podaj godzinę rozpoczęcia (GG:MM).";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) errors.endDate = "Podaj datę zakończenia podróży.";
  if (!/^\d{2}:\d{2}$/.test(endTime)) errors.endTime = "Podaj godzinę zakończenia (GG:MM).";

  const meal = (v: unknown) => {
    const n = typeof v === "number" ? v : Number(v ?? 0);
    return Number.isInteger(n) && n >= 0 && n <= DIETA_MAX_MEALS ? n : NaN;
  };
  const breakfasts = meal(b.breakfasts);
  const lunches = meal(b.lunches);
  const dinners = meal(b.dinners);
  if ([breakfasts, lunches, dinners].some((n) => Number.isNaN(n))) {
    errors.meals = `Liczba posiłków: liczba całkowita 0–${DIETA_MAX_MEALS}.`;
  }

  if (!errors.startDate && !errors.startTime && !errors.endDate && !errors.endTime) {
    const a = toWallClockMinutes(startDate, startTime);
    const z = toWallClockMinutes(endDate, endTime);
    if (a === null) errors.startDate = "Nieprawidłowa data lub godzina rozpoczęcia.";
    else if (z === null) errors.endDate = "Nieprawidłowa data lub godzina zakończenia.";
    else if (z <= a) errors.end = "Koniec podróży musi być później niż początek.";
    else if (z - a > DIETA_MAX_DAYS * MIN_PER_DAY)
      errors.end = `Podróż może trwać maksymalnie ${DIETA_MAX_DAYS} dni.`;
  }

  if (Object.keys(errors).length) return { errors };
  return {
    startDate,
    startTime,
    endDate,
    endTime,
    includeNocleg: b.includeNocleg === true,
    includeDojazdy: b.includeDojazdy === true,
    breakfasts,
    lunches,
    dinners,
  };
}
