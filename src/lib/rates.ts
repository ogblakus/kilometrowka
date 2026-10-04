import type { VehicleType } from "./types";

/**
 * Stawki kilometrówki — rozporządzenie Ministra Infrastruktury z 25.03.2002 r.
 * (Dz.U. 2002 nr 27 poz. 271 ze zm., w tym Dz.U. 2023 poz. 5).
 */
export const KILOMETROWKA_YEAR = 2026;

export const KILOMETROWKA_CITATION =
  "rozporządzenie Ministra Infrastruktury z 25.03.2002 r. (Dz.U. 2002 nr 27 poz. 271 ze zm., w tym Dz.U. 2023 poz. 5)";

export const VEHICLE_LABELS: Record<VehicleType, { label: string; short: string }> = {
  samochod_do_900: { label: "Samochód osobowy ≤ 900 cm³", short: "Auto ≤900 cm³" },
  samochod_ponad_900: { label: "Samochód osobowy > 900 cm³", short: "Auto >900 cm³" },
  motocykl: { label: "Motocykl", short: "Motocykl" },
  motorower: { label: "Motorower", short: "Motorower" },
};

/**
 * Versioned rate table (newest first). A trip uses the rate valid on its
 * trip_date; the rate is also snapshotted on the trip row (rate_pln_per_km),
 * so historical exports stay consistent after a future change.
 */
export const RATE_TABLE: ReadonlyArray<{
  validFrom: string; // YYYY-MM-DD, inclusive
  source: string;
  rates: Record<VehicleType, number>;
}> = [
  {
    validFrom: "2023-01-17",
    source: "Dz.U. 2023 poz. 5",
    rates: {
      samochod_do_900: 0.89,
      samochod_ponad_900: 1.15,
      motocykl: 0.69,
      motorower: 0.42,
    },
  },
  {
    validFrom: "2007-12-01",
    source: "Dz.U. 2007 nr 201 poz. 1462",
    rates: {
      samochod_do_900: 0.5214,
      samochod_ponad_900: 0.8358,
      motocykl: 0.2302,
      motorower: 0.1382,
    },
  },
];

/** Rate valid on the given date (YYYY-MM-DD); defaults to the current table. */
export function getRateForDate(vehicle: VehicleType, date?: string): number {
  if (date) {
    for (const row of RATE_TABLE) {
      if (date >= row.validFrom) return row.rates[vehicle];
    }
    return RATE_TABLE[RATE_TABLE.length - 1].rates[vehicle];
  }
  return RATE_TABLE[0].rates[vehicle];
}

/** Current rates with labels (UI). */
export const VEHICLE_RATES: Record<
  VehicleType,
  { label: string; rate: number; short: string }
> = Object.fromEntries(
  (Object.keys(VEHICLE_LABELS) as VehicleType[]).map((v) => [
    v,
    { ...VEHICLE_LABELS[v], rate: RATE_TABLE[0].rates[v] },
  ]),
) as Record<VehicleType, { label: string; rate: number; short: string }>;

/**
 * Diety krajowe — rozporządzenie MPiPS z 29.01.2013 (t.j. Dz.U. 2023 poz. 2190),
 * § 7 ust. 1 w brzmieniu Dz.U. 2022 poz. 2302 (od 1.01.2023): 45 zł.
 * Ryczałt za nocleg = 150% diety (§ 8 ust. 3), dojazdy = 20% diety (§ 9 ust. 1).
 * Projekt podwyżki do 60 zł (2026) nie jest obowiązującym prawem.
 */
export const DIETA_DOBOWA = 45;
export const DIETA_NOCLEG_RYCZALT = 67.5;
export const DIETA_DOJAZDY_RYCZALT = 9;

export const RATE_SOURCES = [
  {
    title: "Kilometrówka",
    detail:
      "Rozporządzenie Ministra Infrastruktury z dnia 25 marca 2002 r. w sprawie warunków ustalania oraz sposobu dokonywania zwrotu kosztów używania do celów służbowych samochodów osobowych, motocykli i motorowerów niebędących własnością pracodawcy (Dz.U. 2002 nr 27 poz. 271 ze zm.; stawki w brzmieniu Dz.U. 2023 poz. 5, od 17.01.2023). Są to stawki maksymalne.",
  },
  {
    title: "Diety krajowe",
    detail:
      "Rozporządzenie Ministra Pracy i Polityki Społecznej z dnia 29 stycznia 2013 r. w sprawie należności przysługujących pracownikowi zatrudnionemu w państwowej lub samorządowej jednostce sfery budżetowej z tytułu podróży służbowej (t.j. Dz.U. 2023 poz. 2190). Stawka diety krajowej 45 zł obowiązuje od 1 stycznia 2023 r. (zmiana: rozporządzenie Ministra Rodziny i Polityki Społecznej z 25 października 2022 r., Dz.U. 2022 poz. 2302). Projekt podwyższenia do 60 zł nie jest obowiązującym prawem.",
  },
] as const;

export function getRate(vehicle: VehicleType, date?: string): number {
  return getRateForDate(vehicle, date);
}

/** Amount = km × rate, rounded to grosze. Pass `rate` to use a snapshot. */
export function calcTripAmount(
  km: number,
  vehicle: VehicleType,
  dateOrRate?: string | number,
): number {
  const rate =
    typeof dateOrRate === "number" ? dateOrRate : getRateForDate(vehicle, dateOrRate);
  return Math.round(km * rate * 100) / 100;
}
