import type { VehicleType } from "./types";

/** Stawki kilometrówki — Dz.U. 2023 poz. 5 (obowiązujące w 2026) */
export const KILOMETROWKA_YEAR = 2026;

export const VEHICLE_RATES: Record<
  VehicleType,
  { label: string; rate: number; short: string }
> = {
  samochod_do_900: {
    label: "Samochód osobowy ≤ 900 cm³",
    short: "Auto ≤900 cm³",
    rate: 0.89,
  },
  samochod_ponad_900: {
    label: "Samochód osobowy > 900 cm³",
    short: "Auto >900 cm³",
    rate: 1.15,
  },
  motocykl: {
    label: "Motocykl",
    short: "Motocykl",
    rate: 0.69,
  },
  motorower: {
    label: "Motorower",
    short: "Motorower",
    rate: 0.42,
  },
};

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
      "Rozporządzenie Ministra Infrastruktury w sprawie warunków ustalania oraz sposobu dokonywania zwrotu kosztów używania do celów służbowych samochodów osobowych, motocykli i motorowerów niebędących własnością pracodawcy — Dz.U. 2023 poz. 5.",
  },
  {
    title: "Diety krajowe",
    detail:
      "Rozporządzenie Ministra Pracy i Polityki Społecznej z dnia 29 stycznia 2013 r. w sprawie należności przysługujących pracownikowi zatrudnionemu w państwowej lub samorządowej jednostce sfery budżetowej z tytułu podróży służbowej (t.j. Dz.U. 2023 poz. 2190). Stawka diety krajowej 45 zł obowiązuje od 1 stycznia 2023 r. (zmiana: rozporządzenie Ministra Rodziny i Polityki Społecznej z 25 października 2022 r., Dz.U. 2022 poz. 2302). Projekt podwyższenia do 60 zł nie jest obowiązującym prawem.",
  },
] as const;

export function getRate(vehicle: VehicleType): number {
  return VEHICLE_RATES[vehicle].rate;
}

export function calcTripAmount(km: number, vehicle: VehicleType): number {
  return Math.round(km * getRate(vehicle) * 100) / 100;
}
