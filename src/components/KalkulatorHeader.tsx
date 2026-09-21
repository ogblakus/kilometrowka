"use client";

import Link from "next/link";
import { FREE_TRIPS_PER_MONTH, type Plan } from "@/lib/plan";
import { KILOMETROWKA_YEAR, VEHICLE_RATES } from "@/lib/rates";

type Props = {
  plan: Plan;
  tripsThisMonth: number;
  cloudMode: boolean;
};

export default function KalkulatorHeader({
  plan,
  tripsThisMonth,
  cloudMode,
}: Props) {
  const isPremium = plan === "premium";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div
        className={`w-full shrink-0 rounded-lg border px-3 py-2 text-sm shadow-sm sm:order-last sm:w-auto sm:max-w-xs ${
          isPremium
            ? "border-emerald-200 bg-emerald-50"
            : "border-slate-200 bg-white"
        }`}
      >
        <span className="text-slate-500">Plan: </span>
        <strong className={isPremium ? "text-emerald-900" : "text-slate-900"}>
          {isPremium ? "Premium" : "Free"}
        </strong>
        {!isPremium && (
          <>
            <span className="text-slate-400"> · </span>
            <span className="text-slate-600">
              {tripsThisMonth}/{FREE_TRIPS_PER_MONTH} w tym miesiącu
            </span>
            <Link
              href="/kup"
              className="ml-2 rounded font-medium text-slate-900 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Upgrade
            </Link>
          </>
        )}
      </div>

      <div className="min-w-0 w-full sm:flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Ewidencja kilometrówki
          </h1>
          {isPremium && (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
              Premium aktywne
            </span>
          )}
        </div>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
          <p className="font-medium text-slate-700">
            Stawki {KILOMETROWKA_YEAR} (Dz.U. 2023 poz. 5)
          </p>
          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <li className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1.5">
              auto ≤900 cm³ —{" "}
              <strong className="text-slate-900">
                {VEHICLE_RATES.samochod_do_900.rate
                  .toFixed(2)
                  .replace(".", ",")}{" "}
                zł/km
              </strong>
            </li>
            <li className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1.5">
              auto &gt;900 cm³ —{" "}
              <strong className="text-slate-900">
                {VEHICLE_RATES.samochod_ponad_900.rate
                  .toFixed(2)
                  .replace(".", ",")}{" "}
                zł/km
              </strong>
            </li>
            <li className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1.5">
              motocykl —{" "}
              <strong className="text-slate-900">
                {VEHICLE_RATES.motocykl.rate.toFixed(2).replace(".", ",")} zł/km
              </strong>
            </li>
            <li className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1.5">
              motorower —{" "}
              <strong className="text-slate-900">
                {VEHICLE_RATES.motorower.rate.toFixed(2).replace(".", ",")}{" "}
                zł/km
              </strong>
            </li>
          </ul>
          <p>
            {cloudMode
              ? "Dane w chmurze (konto Clerk + Neon)."
              : "Tryb gościa: dane w localStorage tej przeglądarki."}
          </p>
        </div>
      </div>
    </div>
  );
}
