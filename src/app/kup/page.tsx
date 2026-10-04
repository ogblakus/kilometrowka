import type { Metadata } from "next";
import Link from "next/link";
import PremiumOrderForm from "@/components/PremiumOrderForm";
import { OPERATOR, OPERATOR_ADDRESS } from "@/lib/legal";
import { FREE_TRIPS_PER_MONTH, PREMIUM_PRICE_MONTHLY, PREMIUM_PRICE_YEARLY, YEARLY_SAVINGS } from "@/lib/plan";
import { isStripeCheckoutConfigured } from "@/lib/stripe-server";

export const metadata: Metadata = {
  title: "Kup Premium",
  description:
    "Premium: nielimitowane przejazdy, eksport Excel i kalkulator diet krajowych. 29 zł/mies lub 279 zł/rok, subskrypcja odnawiana automatycznie, rezygnacja w każdej chwili.",
};

export default function KupPage() {
  const configured = isStripeCheckoutConfigured();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
      <p className="text-sm font-medium text-slate-500">Premium</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Kup Premium</h1>
      <p className="mt-3 text-base leading-relaxed text-slate-600">
        Plan Free wystarczy na start (do {FREE_TRIPS_PER_MONTH} dodanych przejazdów w miesiącu +
        CSV). Premium to subskrypcja bez limitu przejazdów, z eksportem Excel i kalkulatorem diet.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Miesięcznie</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {PREMIUM_PRICE_MONTHLY} zł
            <span className="text-sm font-normal text-slate-500"> / miesiąc</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">odnawia się co miesiąc</p>
        </div>
        <div className="rounded-xl border-2 border-slate-900 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-900">
            Rocznie — oszczędzasz {YEARLY_SAVINGS} zł
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {PREMIUM_PRICE_YEARLY} zł
            <span className="text-sm font-normal text-slate-500"> / rok</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            ok. {Math.round(PREMIUM_PRICE_YEARLY / 12)} zł/mies · odnawia się co rok
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="font-semibold text-slate-900">Co dostajesz</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>✓ Nielimitowana liczba przejazdów</li>
          <li>✓ Eksport CSV i Excel (.xlsx) w układzie ewidencji przebiegu</li>
          <li>✓ Kalkulator diet krajowych</li>
          <li>✓ Synchronizacja przejazdów między urządzeniami (konto)</li>
        </ul>
      </div>

      <div className="mt-8">
        <PremiumOrderForm configured={configured} />
      </div>

      <div className="mt-6">
        <Link
          href="/kalkulator"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Wróć do kalkulatora
        </Link>
      </div>

      <aside className="mt-10 rounded-lg border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-500">
        <p>
          Sprzedawca: {OPERATOR.person}, {OPERATOR.company}, {OPERATOR_ADDRESS}, NIP {OPERATOR.nip},
          e-mail{" "}
          <a href={`mailto:${OPERATOR.email}`} className="underline">
            {OPERATOR.email}
          </a>
          . Sprzedawca nie jest podatnikiem VAT (zwolnienie z art. 113 ust. 1 ustawy o VAT) —
          na żądanie wystawia fakturę bez VAT. Konsumentowi przysługuje prawo odstąpienia od
          umowy w terminie 14 dni (§ 10 i Załącznik nr 1{" "}
          <Link href="/regulamin" className="underline">
            Regulaminu
          </Link>
          ).
        </p>
      </aside>
    </div>
  );
}
