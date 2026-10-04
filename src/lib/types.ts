export type VehicleType =
  | "samochod_do_900"
  | "samochod_ponad_900"
  | "motocykl"
  | "motorower";

export interface Trip {
  id: string;
  date: string; // YYYY-MM-DD
  from: string;
  to: string;
  km: number;
  purpose: string;
  vehicle: VehicleType;
  amount: number;
  /** Stawka zł/km zapisana przy przejeździe (snapshot); brak = stawka wg daty. */
  rate?: number;
}

/** Dane wymagane w ewidencji przebiegu pojazdu (art. 23 ust. 7 ustawy o PIT). */
export interface EwidencjaProfile {
  fullName: string;
  address: string;
  vehicleRegistration: string;
  /** Pojemność silnika w cm³ (0 = nie podano). */
  vehicleEngineCc: number;
  /** Pracodawca / firma (opcjonalnie). */
  employer: string;
}

export const EMPTY_PROFILE: EwidencjaProfile = {
  fullName: "",
  address: "",
  vehicleRegistration: "",
  vehicleEngineCc: 0,
  employer: "",
};

export interface DietaInput {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  includeNocleg: boolean;
  includeDojazdy: boolean;
  /** Liczba zapewnionych bezpłatnych śniadań (każde −25% diety). */
  breakfasts?: number;
  /** Liczba zapewnionych bezpłatnych obiadów (każdy −50% diety). */
  lunches?: number;
  /** Liczba zapewnionych bezpłatnych kolacji (każda −25% diety). */
  dinners?: number;
}
