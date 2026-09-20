import type { Metadata } from "next";
import Link from "next/link";
import CheckoutButton from "@/components/CheckoutButton";
import {
  FREE_TRIPS_PER_MONTH,
  PREMIUM_PRICE_MONTHLY,
  PREMIUM_PRICE_YEARLY,
} from "@/lib/plan";

export const metadata: Metadata = {
  title: "Kup Premium — Kilometrówka.app",
  description:
    "Odblokuj nielimitowaną ewidencję, eksport Excel i kalkulator diet krajowych. 29 zł/mies lub 279 zł/rok.",
};

export default function KupPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm font-medium text-slate-500">Premium</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        Kup Premium
      </h1>
      <p className="mt-3 text-base leading-relaxed text-slate-600">
        Plan Free wystarczy na start (do {FREE_TRIPS_PER_MONTH} przejazdów /
        miesiąc + CSV). Premium daje pełną ewidencję bez limitów — nadal bez
        konta, dane lokalnie w przeglądarce.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Miesięcznie</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {PREMIUM_PRICE_MONTHLY} zł
            <span className="text-sm font-normal text-slate-500">/mies</span>
          </p>
        </div>
        <div className="rounded-xl border-2 border-slate-900 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Rocznie (−20%)</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {PREMIUM_PRICE_YEARLY} zł
            <span className="text-sm font-normal text-slate-500">/rok</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            ok. {Math.round(PREMIUM_PRICE_YEARLY / 12)} zł/mies
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="font-semibold text-slate-900">Co dostajesz</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>✓ Nielimitowane przejazdy</li>
          <li>✓ Eksport CSV i Excel (.xlsx)</li>
          <li>✓ Kalkulator diet krajowych</li>
          <li>✓ Bez reklam</li>
          <li>✓ Dane lokalnie (localStorage) — bez wymuszonego konta</li>
        </ul>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-start">
        <CheckoutButton />
        <Link
          href="/kalkulator"
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
        >
          Wróć do kalkulatora
        </Link>
      </div>

      <aside className="mt-10 rounded-lg border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-500">
        <p>
          <strong className="text-slate-700">Uwaga:</strong> przycisk „Zapłać”
          otwiera zewnętrzny checkout (Lemon Squeezy lub Stripe Payment Link),
          gdy administrator ustawi zmienną środowiskową. Do czasu podłączenia
          płatności dostępna jest lista oczekujących. Odblokowanie Premium po
          płatności będzie automatyczne (webhook) — na razie do testów możesz
          użyć{" "}
          <code className="rounded bg-slate-100 px-1">/kalkulator?premium=1</code>
          .
        </p>
      </aside>
    </div>
  );
}
