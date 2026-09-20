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
}

export interface WaitlistEntry {
  email: string;
  createdAt: string;
}

export interface DietaInput {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  includeNocleg: boolean;
  includeDojazdy: boolean;
}
