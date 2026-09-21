"use client";

import { useCallback, useEffect, useState } from "react";
import WaitlistForm from "@/components/WaitlistForm";
import {
  getCheckoutUrl,
  PREMIUM_PRICE_MONTHLY,
  PREMIUM_PRICE_YEARLY,
} from "@/lib/plan";

type Interval = "month" | "year";
type Mode = "loading" | "stripe" | "legacy" | "waitlist";

export default function CheckoutButton() {
  const [mode, setMode] = useState<Mode>("loading");
  const [interval, setInterval] = useState<Interval>("year");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/checkout");
        if (res.ok) {
          const data = (await res.json()) as { configured?: boolean };
          if (!cancelled && data.configured) {
            setMode("stripe");
            return;
          }
        }
      } catch {
        /* fall through */
      }
      if (cancelled) return;
      if (getCheckoutUrl()) {
        setMode("legacy");
      } else {
        setMode("waitlist");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const startCheckout = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data = (await res.json()) as {
        url?: string;
        error?: string;
        code?: string;
      };
      if (!res.ok || !data.url) {
        if (data.code === "not_configured") {
          setMode("waitlist");
          setShowWaitlist(true);
          setError(
            "Płatności Stripe nie są jeszcze skonfigurowane. Możesz zapisać się na listę.",
          );
        } else {
          setError(data.error || "Nie udało się rozpocząć płatności.");
        }
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Błąd sieci. Spróbuj ponownie.");
    } finally {
      setBusy(false);
    }
  }, [interval]);

  if (mode === "loading") {
    return (
      <p className="text-sm text-slate-500" aria-live="polite">
        Ładowanie opcji płatności…
      </p>
    );
  }

  if (mode === "legacy") {
    const checkoutUrl = getCheckoutUrl();
    if (!checkoutUrl) {
      return (
        <p className="text-sm text-slate-500">
          Brak skonfigurowanego checkoutu.
        </p>
      );
    }
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

  if (mode === "waitlist" || showWaitlist) {
    return (
      <div className="w-full max-w-md">
        {error && (
          <p className="mb-2 text-sm text-amber-800" role="status">
            {error}
          </p>
        )}
        {!showWaitlist && mode === "waitlist" ? (
          <div className="flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={() => setShowWaitlist(true)}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              Wkrótce — zapisz się
            </button>
            <p className="text-xs text-slate-500">
              Stripe Checkout Sessions jeszcze nieaktywny (brak{" "}
              <code className="rounded bg-slate-100 px-1">STRIPE_SECRET_KEY</code>{" "}
              / Price ID w Vercel). Zostaw e-mail — zapiszemy go lokalnie w tej
              przeglądarce.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-2 text-sm text-slate-600">
              Płatności uruchamiamy wkrótce — zostaw e-mail (zapis lokalny w tej
              przeglądarce):
            </p>
            <WaitlistForm
              buttonLabel="Zapisz na listę"
              successMessage="Świetnie! Zapisaliśmy e-mail lokalnie. Po aktywacji płatności odblokujesz Premium."
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 sm:max-w-md">
      <div
        className="inline-flex rounded-lg border border-slate-300 bg-white p-1 text-sm"
        role="group"
        aria-label="Okres subskrypcji"
      >
        <button
          type="button"
          onClick={() => setInterval("month")}
          className={`flex-1 rounded-md px-3 py-2 font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
            interval === "month"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {PREMIUM_PRICE_MONTHLY} zł/mies
        </button>
        <button
          type="button"
          onClick={() => setInterval("year")}
          className={`flex-1 rounded-md px-3 py-2 font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
            interval === "year"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {PREMIUM_PRICE_YEARLY} zł/rok (−20%)
        </button>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={startCheckout}
        className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Przekierowanie…" : "Zapłać przez Stripe"}
      </button>

      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <p className="text-xs text-slate-500">
        Bezpieczna płatność Stripe Checkout (subskrypcja). Po opłaceniu wrócisz
        na stronę sukcesu i odblokujesz Premium lokalnie.
      </p>
    </div>
  );
}
