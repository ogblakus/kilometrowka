"use client";

import { useState } from "react";
import WaitlistForm from "@/components/WaitlistForm";
import { getCheckoutUrl } from "@/lib/plan";

export default function CheckoutButton() {
  const checkoutUrl = getCheckoutUrl();
  const [showWaitlist, setShowWaitlist] = useState(false);

  if (checkoutUrl) {
    return (
      <a
        href={checkoutUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 sm:w-auto"
      >
        Zapłać
      </a>
    );
  }

  if (showWaitlist) {
    return (
      <div className="w-full max-w-md">
        <p className="mb-2 text-sm text-slate-600">
          Płatności uruchamiamy wkrótce — zostaw e-mail (zapis lokalny w tej
          przeglądarce):
        </p>
        <WaitlistForm
          buttonLabel="Zapisz na listę"
          successMessage="Świetnie! Zapisaliśmy e-mail lokalnie. Po aktywacji płatności odblokujesz Premium."
        />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto">
      <button
        type="button"
        onClick={() => setShowWaitlist(true)}
        className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
      >
        Wkrótce — zapisz się
      </button>
      <p className="text-xs text-slate-500">
        Checkout jeszcze nieaktywny. Jutro podłączymy Lemon Squeezy / Stripe
        (zmienne środowiskowe w Vercel).
      </p>
    </div>
  );
}
