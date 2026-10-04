import { formatDatePl, formatMonthLabel } from "./format";
import { getRateForDate, KILOMETROWKA_CITATION, VEHICLE_RATES } from "./rates";
import type { EwidencjaProfile, Trip } from "./types";

/**
 * Ewidencja przebiegu pojazdu — shared model for CSV and XLSX.
 * Contains what art. 23 ust. 7 ustawy o PIT / the employer's ewidencja
 * requires: person (name, address), vehicle (registration, engine capacity),
 * consecutive entry number, date, purpose, route, km, rate, amount, totals,
 * and signature fields.
 */
export const EWIDENCJA_COLUMNS = [
  "Lp.",
  "Data wyjazdu",
  "Opis trasy (skąd – dokąd)",
  "Cel wyjazdu",
  "Liczba km",
  "Pojazd",
  "Stawka za 1 km (zł)",
  "Wartość (zł)",
] as const;

export type EwidencjaRow = {
  lp: number;
  date: string;
  route: string;
  purpose: string;
  km: number;
  vehicle: string;
  rate: number;
  amount: number;
};

export type Ewidencja = {
  title: string;
  meta: Array<[string, string]>;
  rows: EwidencjaRow[];
  totals: { km: number; amount: number };
  footer: string[];
};

export function tripRate(t: Trip): number {
  return typeof t.rate === "number" && t.rate > 0 ? t.rate : getRateForDate(t.vehicle, t.date);
}

export function buildEwidencja(
  trips: Trip[],
  profile: EwidencjaProfile | null,
  monthKey?: string,
): Ewidencja {
  // Chronological order → consecutive entry numbers (kolejny numer wpisu).
  const sorted = [...trips].sort((a, b) =>
    a.date === b.date ? 0 : a.date < b.date ? -1 : 1,
  );
  const rows: EwidencjaRow[] = sorted.map((t, i) => ({
    lp: i + 1,
    date: formatDatePl(t.date),
    route: `${t.from} – ${t.to}`,
    purpose: t.purpose,
    km: t.km,
    vehicle: VEHICLE_RATES[t.vehicle].label,
    rate: tripRate(t),
    amount: t.amount,
  }));
  const totals = rows.reduce(
    (acc, r) => ({ km: acc.km + r.km, amount: acc.amount + r.amount }),
    { km: 0, amount: 0 },
  );
  totals.km = Math.round(totals.km * 10) / 10;
  totals.amount = Math.round(totals.amount * 100) / 100;

  const p = profile;
  const dash = "—";
  const period = monthKey
    ? formatMonthLabel(monthKey)
    : rows.length
      ? `${rows[0].date} – ${rows[rows.length - 1].date}`
      : dash;
  const meta: Array<[string, string]> = [
    ["Okres", period],
    ["Imię i nazwisko osoby używającej pojazdu", p?.fullName || dash],
    ["Adres zamieszkania", p?.address || dash],
    ["Numer rejestracyjny pojazdu", p?.vehicleRegistration || dash],
    ["Pojemność silnika (cm³)", p?.vehicleEngineCc ? String(p.vehicleEngineCc) : dash],
  ];
  if (p?.employer) meta.push(["Pracodawca / firma", p.employer]);

  return {
    title: "Ewidencja przebiegu pojazdu (kilometrówka)",
    meta,
    rows,
    totals,
    footer: [
      `Stawki: ${KILOMETROWKA_CITATION}. Stawki maksymalne.`,
      "Podpis osoby używającej pojazdu: ........................................   Data: ..................",
      "Podpis pracodawcy / osoby zatwierdzającej: ..............................   Data: ..................",
      "Wygenerowano w Kilometrówka.app — narzędzie pomocnicze, sprawdź dane przed złożeniem.",
    ],
  };
}

export function missingProfileFields(p: EwidencjaProfile | null): string[] {
  const out: string[] = [];
  if (!p?.fullName) out.push("imię i nazwisko");
  if (!p?.address) out.push("adres");
  if (!p?.vehicleRegistration) out.push("numer rejestracyjny");
  if (!p?.vehicleEngineCc) out.push("pojemność silnika");
  return out;
}
