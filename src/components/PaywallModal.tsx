"use client";

import Link from "next/link";
import { FREE_TRIPS_PER_MONTH, PREMIUM_PRICE_MONTHLY } from "@/lib/plan";

interface Props {
  reason: "trips" | "excel" | "dieta";
  onClose: () => void;
}

const copy: Record<Props["reason"], { title: string; body: string }> = {
  trips: {
    title: "Limit darmowego planu",
    body: `Na planie Free możesz dodać maksymalnie ${FREE_TRIPS_PER_MONTH} przejazdów w miesiącu. Premium daje nielimitowaną ewidencję.`,
  },
  excel: {
    title: "Eksport Excel w Premium",
    body: "CSV jest dostępny za darmo. Eksport Excel (.xlsx) wymaga planu Premium.",
  },
  dieta: {
    title: "Diety krajowe w Premium",
    body: "Kalkulator diet krajowych (45 zł/doba, ryczałty) jest dostępny w Premium.",
  },
};

export default function PaywallModal({ reason, onClose }: Props) {
  const c = copy[reason];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="paywall-title" className="text-lg font-semibold text-slate-900">
          {c.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.body}</p>
        <ul className="mt-4 space-y-1.5 text-sm text-slate-700">
          <li>✓ Nielimitowane przejazdy</li>
          <li>✓ Eksport Excel + CSV</li>
          <li>✓ Kalkulator diet krajowych</li>
          <li>✓ Bez reklam</li>
        </ul>
        <p className="mt-3 text-sm text-slate-500">
          od{" "}
          <strong className="text-slate-900">
            {PREMIUM_PRICE_MONTHLY} zł/mies
          </strong>{" "}
          lub taniej rocznie
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/kup"
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            Zobacz Premium
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
