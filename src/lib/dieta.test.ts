import { describe, expect, it } from "vitest";
import {
  calcDieta,
  countLumpSumNights,
  countStartedDays,
  dietaPercentForMinutes,
} from "./dieta";
import {
  DIETA_DOBOWA,
  DIETA_DOJAZDY_RYCZALT,
  DIETA_NOCLEG_RYCZALT,
} from "./rates";
import type { DietaInput } from "./types";

const D = DIETA_DOBOWA;

/** Podróż od 2026-03-02 08:00 trwająca podaną liczbę minut. */
function trip(minutes: number, extra: Partial<DietaInput> = {}): DietaInput {
  const start = Date.UTC(2026, 2, 2, 8, 0);
  const end = new Date(start + minutes * 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    startDate: "2026-03-02",
    startTime: "08:00",
    endDate: `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}`,
    endTime: `${pad(end.getUTCHours())}:${pad(end.getUTCMinutes())}`,
    includeNocleg: false,
    includeDojazdy: false,
    ...extra,
  };
}

const H = 60;
const DAY = 24 * H;

function dieta(minutes: number, extra: Partial<DietaInput> = {}) {
  const r = calcDieta(trip(minutes, extra));
  expect(r).not.toBeNull();
  return r!;
}

describe("rates", () => {
  it("dieta 45 zł, ryczałt noclegowy 150%, dojazdy 20%", () => {
    expect(D).toBe(45);
    expect(DIETA_NOCLEG_RYCZALT).toBe(D * 1.5);
    expect(DIETA_DOJAZDY_RYCZALT).toBe(D * 0.2);
  });
});

describe("walidacja wejścia", () => {
  const base: DietaInput = {
    startDate: "2026-03-02",
    startTime: "08:00",
    endDate: "2026-03-02",
    endTime: "08:00",
    includeNocleg: true,
    includeDojazdy: true,
  };

  it("zerowy czas → null", () => {
    expect(calcDieta(base)).toBeNull();
  });

  it("ujemny czas (koniec przed początkiem) → null", () => {
    expect(calcDieta({ ...base, endTime: "07:59" })).toBeNull();
    expect(calcDieta({ ...base, endDate: "2026-03-01", endTime: "20:00" })).toBeNull();
  });

  it("brak pól lub nieprawidłowa data → null", () => {
    expect(calcDieta({ ...base, endDate: "" })).toBeNull();
    expect(calcDieta({ ...base, endDate: "2026-02-30", endTime: "10:00" })).toBeNull();
    expect(calcDieta({ ...base, endTime: "25:00" })).toBeNull();
  });

  it("funkcje pomocnicze zwracają 0 dla czasu ≤ 0", () => {
    expect(dietaPercentForMinutes(0)).toBe(0);
    expect(dietaPercentForMinutes(-60)).toBe(0);
    expect(countStartedDays(0)).toBe(0);
    expect(countLumpSumNights(100, 100)).toBe(0);
  });
});

describe("dieta — podróż do 24 h (§ 7 ust. 2 pkt 1)", () => {
  it.each([
    ["1 min", 1, 0],
    ["7 h 59 min", 8 * H - 1, 0],
    ["dokładnie 8 h", 8 * H, 0.5],
    ["8 h 1 min", 8 * H + 1, 0.5],
    ["dokładnie 12 h", 12 * H, 0.5],
    ["12 h 1 min", 12 * H + 1, 1],
    ["23 h 59 min", DAY - 1, 1],
    ["dokładnie 24 h", DAY, 1],
  ])("%s → %s × dieta", (_label, minutes, factor) => {
    const r = dieta(minutes);
    expect(r.totalMinutes).toBe(minutes);
    expect(r.dietaAmount).toBe(D * factor);
    expect(r.total).toBe(D * factor);
  });
});

describe("dieta — podróż powyżej 24 h (§ 7 ust. 2 pkt 2)", () => {
  it.each([
    ["24 h 1 min", DAY + 1, 1.5],
    ["24 h + 7 h 59 min", DAY + 8 * H - 1, 1.5],
    ["24 h + 8 h", DAY + 8 * H, 1.5],
    ["24 h + 8 h 1 min", DAY + 8 * H + 1, 2],
    ["24 h + 12 h", DAY + 12 * H, 2],
    ["dokładnie 48 h", 2 * DAY, 2],
    ["3 doby 5 h", 3 * DAY + 5 * H, 3.5],
    ["3 doby 9 h", 3 * DAY + 9 * H, 4],
    ["10 dób", 10 * DAY, 10],
  ])("%s → %s × dieta", (_label, minutes, factor) => {
    expect(dieta(minutes).dietaAmount).toBe(D * factor);
  });

  it("opis rozbicia dla 3 dób 5 h", () => {
    const r = dieta(3 * DAY + 5 * H);
    expect(r.breakdown[0]).toContain("3 pełne doby");
    expect(r.breakdown[1]).toContain("Rozpoczęta doba 5 h (do 8 h) — 50%");
  });
});

describe("przejście przez północ", () => {
  it("20:00 → 06:00 następnego dnia = 10 h → 50%", () => {
    const r = calcDieta({
      startDate: "2026-03-02",
      startTime: "20:00",
      endDate: "2026-03-03",
      endTime: "06:00",
      includeNocleg: false,
      includeDojazdy: false,
    })!;
    expect(r.totalMinutes).toBe(10 * H);
    expect(r.dietaAmount).toBe(D / 2);
  });

  it("18:00 → 07:00 następnego dnia = 13 h → 100%", () => {
    const r = calcDieta({
      startDate: "2026-03-02",
      startTime: "18:00",
      endDate: "2026-03-03",
      endTime: "07:00",
      includeNocleg: false,
      includeDojazdy: false,
    })!;
    expect(r.dietaAmount).toBe(D);
  });

  it("przełom miesiąca i roku (31.12 22:00 → 02.01 01:00 = 27 h → 1,5 diety)", () => {
    const r = calcDieta({
      startDate: "2026-12-31",
      startTime: "22:00",
      endDate: "2027-01-02",
      endTime: "01:00",
      includeNocleg: false,
      includeDojazdy: false,
    })!;
    expect(r.totalMinutes).toBe(27 * H);
    expect(r.dietaAmount).toBe(D * 1.5);
  });

  it("czas liczony zegarowo — zmiana czasu (29.03.2026) nie zmienia wyniku", () => {
    const r = calcDieta({
      startDate: "2026-03-28",
      startTime: "20:00",
      endDate: "2026-03-29",
      endTime: "08:00",
      includeNocleg: false,
      includeDojazdy: false,
    })!;
    expect(r.totalMinutes).toBe(12 * H);
    expect(r.dietaAmount).toBe(D / 2);
  });
});

describe("zapewnione posiłki (§ 7 ust. 4)", () => {
  it("śniadanie −25%, obiad −50%, kolacja −25% pełnej diety", () => {
    expect(dieta(13 * H, { breakfasts: 1 }).dietaAmount).toBe(D * 0.75);
    expect(dieta(13 * H, { lunches: 1 }).dietaAmount).toBe(D * 0.5);
    expect(dieta(13 * H, { dinners: 1 }).dietaAmount).toBe(D * 0.75);
    expect(dieta(13 * H, { breakfasts: 1, dinners: 1 }).mealReduction).toBe(D * 0.5);
  });

  it("wszystkie trzy posiłki → dieta 0 zł", () => {
    const r = dieta(13 * H, { breakfasts: 1, lunches: 1, dinners: 1 });
    expect(r.dietaGross).toBe(D);
    expect(r.dietaAmount).toBe(0);
  });

  it("odliczenie liczone od pełnej stawki także przy 50% diety", () => {
    // 10 h → 22,50 zł; śniadanie = 25% z 45 zł = 11,25 zł
    expect(dieta(10 * H, { breakfasts: 1 }).dietaAmount).toBe(11.25);
  });

  it("odliczenia powyżej 100% są ograniczone do 0 zł (bez ujemnej diety)", () => {
    const r = dieta(10 * H, { breakfasts: 1, lunches: 1 });
    expect(r.dietaAmount).toBe(0);
    expect(r.mealReduction).toBe(D / 2);
    expect(r.breakdown.some((l) => l.includes("ograniczone"))).toBe(true);
  });

  it("ograniczenie do 0 nie obniża ryczałtów", () => {
    const r = dieta(2 * DAY, {
      breakfasts: 5,
      lunches: 5,
      dinners: 5,
      includeDojazdy: true,
    });
    expect(r.dietaAmount).toBe(0);
    expect(r.dojazdyAmount).toBe(2 * DIETA_DOJAZDY_RYCZALT);
    expect(r.total).toBe(2 * DIETA_DOJAZDY_RYCZALT);
  });

  it("wielodniowa podróż z posiłkami", () => {
    // 3 doby 5 h = 157,50 zł; 2 śniadania + 1 obiad = 100% = 45 zł
    expect(dieta(3 * DAY + 5 * H, { breakfasts: 2, lunches: 1 }).dietaAmount).toBe(112.5);
  });

  it("ujemne / ułamkowe liczby posiłków są ignorowane lub zaokrąglane w dół", () => {
    expect(dieta(13 * H, { breakfasts: -2 }).dietaAmount).toBe(D);
    expect(dieta(13 * H, { lunches: 1.9 }).dietaAmount).toBe(D / 2);
    expect(dieta(13 * H, { dinners: Number.NaN }).dietaAmount).toBe(D);
  });
});

describe("ryczałt za nocleg (§ 8 ust. 3–4)", () => {
  function nocleg(
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string
  ) {
    return calcDieta({
      startDate,
      startTime,
      endDate,
      endTime,
      includeNocleg: true,
      includeDojazdy: false,
    })!;
  }

  it("noc krótsza niż 6 h (21:00–02:59 = 5 h 59 min) → brak ryczałtu", () => {
    const r = nocleg("2026-03-02", "08:00", "2026-03-03", "02:59");
    expect(r.nights).toBe(0);
    expect(r.noclegAmount).toBe(0);
  });

  it("noc dokładnie 6 h (21:00–03:00) → 1 ryczałt", () => {
    const r = nocleg("2026-03-02", "08:00", "2026-03-03", "03:00");
    expect(r.nights).toBe(1);
    expect(r.noclegAmount).toBe(DIETA_NOCLEG_RYCZALT);
  });

  it("wyjazd o 01:01 → 5 h 59 min do 7:00 → brak; wyjazd 01:00 → 6 h → 1", () => {
    expect(nocleg("2026-03-02", "01:01", "2026-03-02", "20:00").nights).toBe(0);
    expect(nocleg("2026-03-02", "01:00", "2026-03-02", "20:00").nights).toBe(1);
  });

  it("jednodniowa podróż w dzień (>12 h) → brak nocy", () => {
    expect(nocleg("2026-03-02", "06:00", "2026-03-02", "20:30").nights).toBe(0);
  });

  it("podróż < 24 h, ale z pełną nocą (22:00 → 20:00) → 1 noc", () => {
    expect(nocleg("2026-03-02", "22:00", "2026-03-03", "20:00").nights).toBe(1);
  });

  it("3 doby 5 h (pon 08:00 → czw 13:00) → 3 noce", () => {
    const r = nocleg("2026-03-02", "08:00", "2026-03-05", "13:00");
    expect(r.nights).toBe(3);
    expect(r.noclegAmount).toBe(3 * DIETA_NOCLEG_RYCZALT);
  });

  it("liczba nocy nie jest liczbą pełnych dób (pon 20:00 → czw 06:00 → 3 noce)", () => {
    const r = nocleg("2026-03-02", "20:00", "2026-03-05", "06:00");
    expect(Math.floor(r.totalMinutes / DAY)).toBe(2);
    expect(r.nights).toBe(3);
  });

  it("bez zaznaczenia ryczałtu → 0 zł", () => {
    const r = calcDieta({
      startDate: "2026-03-02",
      startTime: "08:00",
      endDate: "2026-03-05",
      endTime: "13:00",
      includeNocleg: false,
      includeDojazdy: false,
    })!;
    expect(r.noclegAmount).toBe(0);
  });
});

describe("ryczałt na dojazdy (§ 9) — za każdą rozpoczętą dobę", () => {
  it.each([
    ["1 min", 1, 1],
    ["5 h (bez progu 8 h)", 5 * H, 1],
    ["10 h", 10 * H, 1],
    ["dokładnie 24 h", DAY, 1],
    ["24 h 1 min", DAY + 1, 2],
    ["3 doby 5 h", 3 * DAY + 5 * H, 4],
  ])("%s → %s × ryczałt", (_label, minutes, days) => {
    const r = dieta(minutes, { includeDojazdy: true });
    expect(r.startedDays).toBe(days);
    expect(r.dojazdyAmount).toBe(days * DIETA_DOJAZDY_RYCZALT);
  });

  it("bez zaznaczenia ryczałtu → 0 zł", () => {
    expect(dieta(10 * H).dojazdyAmount).toBe(0);
  });
});

describe("suma", () => {
  it("3 doby 5 h z noclegami i dojazdami", () => {
    const r = calcDieta({
      startDate: "2026-03-02",
      startTime: "08:00",
      endDate: "2026-03-05",
      endTime: "13:00",
      includeNocleg: true,
      includeDojazdy: true,
    })!;
    // 157,50 + 3 × 67,50 + 4 × 9 = 396,00
    expect(r.dietaAmount).toBe(157.5);
    expect(r.noclegAmount).toBe(202.5);
    expect(r.dojazdyAmount).toBe(36);
    expect(r.total).toBe(396);
  });
});
