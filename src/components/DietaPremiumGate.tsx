"use client";

import Link from "next/link";
import DietaCalculator from "@/components/DietaCalculator";

interface Props {
  unlocked: boolean;
  onMoreInfo: () => void;
}

export default function DietaPremiumGate({ unlocked, onMoreInfo }: Props) {
  if (unlocked) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
            Premium
          </span>
          <span className="text-xs text-slate-500">
            Kalkulator diet odblokowany
          </span>
        </div>
        <DietaCalculator />
      </div>
    );
  }

  return (
    <section
      className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center shadow-sm sm:p-8"
      aria-labelledby="dieta-gate-title"
    >
      <p id="dieta-gate-title" className="font-semibold text-slate-900">
        Diety krajowe — Premium
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        Kalkulator diet (45 zł/doba, ryczałty noclegowe i dojazdów) jest dostępny
        w planie Premium. Free obejmuje ewidencję km i CSV.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link
          href="/kup"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
        >
          Odblokuj diety
        </Link>
        <button
          type="button"
          onClick={onMoreInfo}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
        >
          Więcej info
        </button>
      </div>
    </section>
  );
}
