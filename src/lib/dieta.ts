import {
  DIETA_DOBOWA,
  DIETA_DOJAZDY_RYCZALT,
  DIETA_NOCLEG_RYCZALT,
} from "./rates";
import type { DietaInput } from "./types";

export interface DietaResult {
  totalHours: number;
  dietaAmount: number;
  noclegAmount: number;
  dojazdyAmount: number;
  total: number;
  breakdown: string[];
}

/**
 * Uproszczone obliczenie diety krajowej wg §7 rozporządzenia o podróżach służbowych.
 * - < 8 h: 0
 * - 8–12 h: 50%
 * - > 12 h: 100%
 * - wielodniowe: pełne doby + pozostały czas jak wyżej
 */
export function calcDieta(input: DietaInput): DietaResult | null {
  if (!input.startDate || !input.endDate || !input.startTime || !input.endTime) {
    return null;
  }

  const start = new Date(`${input.startDate}T${input.startTime}:00`);
  const end = new Date(`${input.endDate}T${input.endTime}:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null;
  }

  const totalMs = end.getTime() - start.getTime();
  const totalHours = totalMs / (1000 * 60 * 60);
  const fullDays = Math.floor(totalHours / 24);
  const remainderHours = totalHours - fullDays * 24;

  let dietaAmount = fullDays * DIETA_DOBOWA;
  const breakdown: string[] = [];

  if (fullDays > 0) {
    breakdown.push(
      `${fullDays} pełn${fullDays === 1 ? "a doba" : fullDays < 5 ? "e doby" : "ych dób"} × ${DIETA_DOBOWA} zł = ${(fullDays * DIETA_DOBOWA).toFixed(2).replace(".", ",")} zł`
    );
  }

  if (remainderHours < 8) {
    if (fullDays === 0) {
      breakdown.push(`Pozostały czas < 8 h — dieta 0 zł`);
    } else if (remainderHours > 0) {
      breakdown.push(
        `Pozostałe ${remainderHours.toFixed(1).replace(".", ",")} h < 8 h — bez dodatkowej diety`
      );
    }
  } else if (remainderHours <= 12) {
    const partial = DIETA_DOBOWA * 0.5;
    dietaAmount += partial;
    breakdown.push(
      `Pozostałe ${remainderHours.toFixed(1).replace(".", ",")} h (8–12 h) — 50% = ${partial.toFixed(2).replace(".", ",")} zł`
    );
  } else {
    dietaAmount += DIETA_DOBOWA;
    breakdown.push(
      `Pozostałe ${remainderHours.toFixed(1).replace(".", ",")} h (> 12 h) — 100% = ${DIETA_DOBOWA.toFixed(2).replace(".", ",")} zł`
    );
  }

  let noclegAmount = 0;
  if (input.includeNocleg) {
    const nights =
      fullDays > 0 ? fullDays : totalHours > 12 ? 1 : 0;
    noclegAmount = nights * DIETA_NOCLEG_RYCZALT;
    if (nights > 0) {
      breakdown.push(
        `Ryczałt noclegowy: ${nights} × ${DIETA_NOCLEG_RYCZALT.toFixed(2).replace(".", ",")} zł = ${noclegAmount.toFixed(2).replace(".", ",")} zł`
      );
    }
  }

  let dojazdyAmount = 0;
  if (input.includeDojazdy) {
    const trips = totalHours >= 8 ? 2 : 0;
    dojazdyAmount = trips * DIETA_DOJAZDY_RYCZALT;
    if (trips > 0) {
      breakdown.push(
        `Ryczałt dojazdów: ${trips} × ${DIETA_DOJAZDY_RYCZALT.toFixed(2).replace(".", ",")} zł = ${dojazdyAmount.toFixed(2).replace(".", ",")} zł`
      );
    }
  }

  const total =
    Math.round((dietaAmount + noclegAmount + dojazdyAmount) * 100) / 100;

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    dietaAmount: Math.round(dietaAmount * 100) / 100,
    noclegAmount: Math.round(noclegAmount * 100) / 100,
    dojazdyAmount: Math.round(dojazdyAmount * 100) / 100,
    total,
    breakdown,
  };
}
