import {
  DIETA_DOBOWA,
  DIETA_DOJAZDY_RYCZALT,
  DIETA_NOCLEG_RYCZALT,
} from "./rates";
import type { DietaInput } from "./types";

export interface DietaResult {
  /** Czas podróży w godzinach (zaokrąglony do 0,1 h — do wyświetlania). */
  totalHours: number;
  /** Dokładny czas podróży w minutach. */
  totalMinutes: number;
  /** Dieta po odliczeniu zapewnionych posiłków (nie mniej niż 0 zł). */
  dietaAmount: number;
  /** Dieta przed odliczeniem posiłków. */
  dietaGross: number;
  /** Kwota odliczenia za zapewnione posiłki (po ograniczeniu do wysokości diety). */
  mealReduction: number;
  noclegAmount: number;
  /** Liczba nocy uprawniających do ryczałtu (≥ 6 h między 21:00 a 7:00). */
  nights: number;
  dojazdyAmount: number;
  /** Liczba rozpoczętych dób podróży (podstawa ryczałtu na dojazdy). */
  startedDays: number;
  total: number;
  breakdown: string[];
}

const MIN_PER_HOUR = 60;
const MIN_PER_DAY = 24 * MIN_PER_HOUR;
const H8 = 8 * MIN_PER_HOUR;
const H12 = 12 * MIN_PER_HOUR;
/** Okno nocne dla ryczałtu noclegowego: 21:00–7:00 (§ 8 ust. 4). */
const NIGHT_START = 21 * MIN_PER_HOUR;
const NIGHT_LENGTH = 10 * MIN_PER_HOUR;
const NIGHT_MIN_OVERLAP = 6 * MIN_PER_HOUR;

/** Posiłki jako % diety (§ 7 ust. 4). */
const MEAL_PERCENT = { breakfast: 25, lunch: 50, dinner: 25 } as const;

const round2 = (n: number) => Math.round(n * 100) / 100;
const zl = (n: number) => `${n.toFixed(2).replace(".", ",")} zł`;

function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / MIN_PER_HOUR);
  const m = minutes % MIN_PER_HOUR;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/**
 * Zamienia datę i godzinę na minuty „zegarowe” (bez stref czasowych i zmiany
 * czasu letni/zimowy), żeby wynik nie zależał od strefy przeglądarki.
 */
function toWallClockMinutes(date: string, time: string): number | null {
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

function toCount(n: number | undefined): number {
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/**
 * Procent diety za podróż krajową wg § 7 ust. 2 rozporządzenia MPiPS
 * z 29.01.2013 r. (t.j. Dz.U. 2023 poz. 2190):
 * - podróż ≤ 24 h: < 8 h → 0%, 8–12 h → 50%, > 12 h → 100%
 * - podróż > 24 h: każda pełna doba → 100%, rozpoczęta doba do 8 h → 50%,
 *   ponad 8 h → 100%
 */
export function dietaPercentForMinutes(totalMinutes: number): number {
  if (!(totalMinutes > 0)) return 0;
  if (totalMinutes <= MIN_PER_DAY) {
    if (totalMinutes < H8) return 0;
    if (totalMinutes <= H12) return 50;
    return 100;
  }
  const fullDays = Math.floor(totalMinutes / MIN_PER_DAY);
  const rest = totalMinutes - fullDays * MIN_PER_DAY;
  let percent = fullDays * 100;
  if (rest > 0) percent += rest <= H8 ? 50 : 100;
  return percent;
}

/**
 * Liczba nocy, w których podróż obejmuje co najmniej 6 h pomiędzy 21:00 a 7:00
 * (§ 8 ust. 4). Zakłada, że w tym czasie był nocleg (nie przejazd).
 */
export function countLumpSumNights(startMin: number, endMin: number): number {
  if (!(endMin > startMin)) return 0;
  let nights = 0;
  const firstDay = Math.floor(startMin / MIN_PER_DAY) - 1;
  const lastDay = Math.floor(endMin / MIN_PER_DAY);
  for (let day = firstDay; day <= lastDay; day++) {
    const winStart = day * MIN_PER_DAY + NIGHT_START;
    const winEnd = winStart + NIGHT_LENGTH;
    const overlap = Math.min(endMin, winEnd) - Math.max(startMin, winStart);
    if (overlap >= NIGHT_MIN_OVERLAP) nights++;
  }
  return nights;
}

/** Liczba rozpoczętych dób podróży (liczonych od godziny wyjazdu). */
export function countStartedDays(totalMinutes: number): number {
  return totalMinutes > 0 ? Math.ceil(totalMinutes / MIN_PER_DAY) : 0;
}

/**
 * Należności z tytułu krajowej podróży służbowej wg §§ 7–9 rozporządzenia
 * MPiPS z 29.01.2013 r. (t.j. Dz.U. 2023 poz. 2190). Uproszczenia:
 * - czas liczony „zegarowo” (bez korekty zmiany czasu),
 * - posiłki odliczane łącznie od sumy diet, wynik nie mniejszy niż 0 zł,
 * - ryczałt za nocleg: za każdą noc z ≥ 6 h podróży między 21:00 a 7:00,
 *   przy założeniu braku rachunku i niezapewnionego noclegu,
 * - ryczałt na dojazdy: 20% diety za każdą rozpoczętą dobę podróży.
 */
export function calcDieta(input: DietaInput): DietaResult | null {
  if (!input.startDate || !input.endDate || !input.startTime || !input.endTime) {
    return null;
  }

  const startMin = toWallClockMinutes(input.startDate, input.startTime);
  const endMin = toWallClockMinutes(input.endDate, input.endTime);
  if (startMin === null || endMin === null || endMin <= startMin) {
    return null;
  }

  const totalMinutes = endMin - startMin;
  const breakdown: string[] = [];

  // --- Dieta (§ 7 ust. 2) ---
  const percent = dietaPercentForMinutes(totalMinutes);
  const dietaGross = (DIETA_DOBOWA * percent) / 100;

  if (totalMinutes <= MIN_PER_DAY) {
    const dur = formatDuration(totalMinutes);
    if (percent === 0) {
      breakdown.push(`Podróż ${dur} (< 8 h) — dieta nie przysługuje`);
    } else if (percent === 50) {
      breakdown.push(`Podróż ${dur} (8–12 h) — 50% diety = ${zl(dietaGross)}`);
    } else {
      breakdown.push(`Podróż ${dur} (> 12 h) — 100% diety = ${zl(dietaGross)}`);
    }
  } else {
    const fullDays = Math.floor(totalMinutes / MIN_PER_DAY);
    const rest = totalMinutes - fullDays * MIN_PER_DAY;
    breakdown.push(
      `${fullDays} ${plural(fullDays, "pełna doba", "pełne doby", "pełnych dób")} × ${zl(DIETA_DOBOWA)} = ${zl(fullDays * DIETA_DOBOWA)}`
    );
    if (rest > 0) {
      const part = rest <= H8 ? DIETA_DOBOWA * 0.5 : DIETA_DOBOWA;
      breakdown.push(
        rest <= H8
          ? `Rozpoczęta doba ${formatDuration(rest)} (do 8 h) — 50% = ${zl(part)}`
          : `Rozpoczęta doba ${formatDuration(rest)} (ponad 8 h) — 100% = ${zl(part)}`
      );
    }
  }

  // --- Zapewnione posiłki (§ 7 ust. 4) ---
  const breakfasts = toCount(input.breakfasts);
  const lunches = toCount(input.lunches);
  const dinners = toCount(input.dinners);
  const mealPercent =
    breakfasts * MEAL_PERCENT.breakfast +
    lunches * MEAL_PERCENT.lunch +
    dinners * MEAL_PERCENT.dinner;
  const rawReduction = (DIETA_DOBOWA * mealPercent) / 100;
  const mealReduction = Math.min(rawReduction, dietaGross);
  const dietaAmount = dietaGross - mealReduction;

  if (mealPercent > 0) {
    const parts: string[] = [];
    if (breakfasts) parts.push(`śniadania: ${breakfasts} × 25%`);
    if (lunches) parts.push(`obiady: ${lunches} × 50%`);
    if (dinners) parts.push(`kolacje: ${dinners} × 25%`);
    breakdown.push(
      `Zapewnione posiłki (${parts.join(", ")}) — −${zl(rawReduction)}` +
        (rawReduction > dietaGross ? ` (ograniczone do wysokości diety — dieta 0 zł)` : "")
    );
  }

  // --- Ryczałt za nocleg (§ 8 ust. 3–4) ---
  let nights = 0;
  let noclegAmount = 0;
  if (input.includeNocleg) {
    nights = countLumpSumNights(startMin, endMin);
    noclegAmount = nights * DIETA_NOCLEG_RYCZALT;
    breakdown.push(
      nights > 0
        ? `Ryczałt za nocleg: ${nights} ${plural(nights, "noc", "noce", "nocy")} × ${zl(DIETA_NOCLEG_RYCZALT)} = ${zl(noclegAmount)}`
        : `Ryczałt za nocleg: brak nocy z min. 6 h między 21:00 a 7:00 — 0 zł`
    );
  }

  // --- Ryczałt na dojazdy komunikacją miejscową (§ 9) ---
  const startedDays = countStartedDays(totalMinutes);
  let dojazdyAmount = 0;
  if (input.includeDojazdy) {
    dojazdyAmount = startedDays * DIETA_DOJAZDY_RYCZALT;
    breakdown.push(
      `Ryczałt na dojazdy: ${startedDays} ${plural(startedDays, "rozpoczęta doba", "rozpoczęte doby", "rozpoczętych dób")} × ${zl(DIETA_DOJAZDY_RYCZALT)} = ${zl(dojazdyAmount)}`
    );
  }

  return {
    totalHours: Math.round((totalMinutes / MIN_PER_HOUR) * 10) / 10,
    totalMinutes,
    dietaAmount: round2(dietaAmount),
    dietaGross: round2(dietaGross),
    mealReduction: round2(mealReduction),
    noclegAmount: round2(noclegAmount),
    nights,
    dojazdyAmount: round2(dojazdyAmount),
    startedDays,
    total: round2(dietaAmount + noclegAmount + dojazdyAmount),
    breakdown,
  };
}
