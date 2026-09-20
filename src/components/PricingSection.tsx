"use client";

import Link from "next/link";
import { useState } from "react";
import WaitlistForm from "@/components/WaitlistForm";
import {
  FREE_TRIPS_PER_MONTH,
  PREMIUM_PRICE_MONTHLY,
  PREMIUM_PRICE_YEARLY,
} from "@/lib/plan";
import { KILOMETROWKA_YEAR } from "@/lib/rates";

export default function PricingSection() {
  const [yearly, setYearly] = useState(true);
  const premiumPrice = yearly ? PREMIUM_PRICE_YEARLY : PREMIUM_PRICE_MONTHLY;
  const premiumUnit = yearly ? "zł/rok" : "zł/mies";

  return (
    <section id="cennik" className="scroll-mt-20 border-t border-slate-200 bg-slate-50 py-16">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Cennik</h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Zacznij za darmo. Premium odblokowuje Excel, diety i nielimitowaną
              ewidencję. Dane nadal zostają w Twojej przeglądarce.
            </p>
          </div>
          <div
            className="inline-flex rounded-lg border border-slate-300 bg-white p-1 text-sm"
            role="group"
            aria-label="Okres rozliczenia"
          >
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={`rounded-md px-3 py-1.5 font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                !yearly
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Miesięcznie
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={`rounded-md px-3 py-1.5 font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                yearly
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Rocznie{" "}
              <span className="text-xs opacity-80">(-20%)</span>
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Free</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">0 zł</p>
            <p className="mt-1 text-sm text-slate-500">na zawsze</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
              <li>✓ Do {FREE_TRIPS_PER_MONTH} przejazdów / miesiąc</li>
              <li>✓ Stawki kilometrówki {KILOMETROWKA_YEAR}</li>
              <li>✓ Eksport CSV</li>
              <li className="text-slate-400">✗ Eksport Excel</li>
              <li className="text-slate-400">✗ Kalkulator diet</li>
            </ul>
            <Link
              href="/kalkulator"
              className="mt-6 inline-flex justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              Korzystaj za darmo
            </Link>
          </div>

          <div className="relative flex flex-col rounded-xl border-2 border-slate-900 bg-white p-6 shadow-md">
            <span className="absolute -top-3 left-4 rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white">
              Polecane
            </span>
            <p className="text-sm font-medium text-slate-500">Premium</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {premiumPrice}{" "}
              <span className="text-base font-normal text-slate-500">
                {premiumUnit}
              </span>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {yearly
                ? `ok. ${Math.round(PREMIUM_PRICE_YEARLY / 12)} zł/mies · oszczędzasz ${PREMIUM_PRICE_MONTHLY * 12 - PREMIUM_PRICE_YEARLY} zł`
                : `lub ${PREMIUM_PRICE_YEARLY} zł/rok (−20%)`}
            </p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
              <li>✓ Nielimitowane przejazdy</li>
              <li>✓ Eksport CSV i Excel</li>
              <li>✓ Kalkulator diet krajowych</li>
              <li>✓ Bez reklam</li>
            </ul>
            <Link
              href="/kup"
              className="mt-6 inline-flex justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              Kup Premium
            </Link>
          </div>

          <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Dla firm</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              99{" "}
              <span className="text-base font-normal text-slate-500">
                zł/mies
              </span>
            </p>
            <p className="mt-1 text-sm text-slate-500">wycena indywidualna</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
              <li>• Wiele użytkowników / pojazdów</li>
              <li>• Eksport i raporty dla HR</li>
              <li>• Wsparcie wdrożenia</li>
              <li>• Faktura VAT (po ustaleniu)</li>
            </ul>
            <a
              href="mailto:kontakt@kilometrowka.app?subject=Kilometr%C3%B3wka.app%20%E2%80%94%20oferta%20dla%20firm"
              className="mt-6 inline-flex justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              Napisz do nas
            </a>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="mb-2 text-xs text-slate-500">
                Albo zostaw e-mail (zapis lokalny):
              </p>
              <WaitlistForm
                successMessage="Dziękujemy! Zapisaliśmy kontakt lokalnie — odezwijemy się w sprawie oferty dla firm."
                buttonLabel="Wyślij zainteresowanie"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
