"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SignInButton, useAuth } from "@clerk/nextjs";
import ManageSubscriptionButton from "@/components/ManageSubscriptionButton";
import { fetchCloudMe } from "@/lib/cloudTrips";
import {
  BUSINESS_PURPOSE_LABELS,
  EARLY_START_TEXT,
  OPERATOR,
  intervalLabel,
  type BillingInterval,
  type BusinessPurpose,
} from "@/lib/legal";
import { PREMIUM_PRICE_MONTHLY, PREMIUM_PRICE_YEARLY, YEARLY_SAVINGS } from "@/lib/plan";

type Props = { configured: boolean };

const btn =
  "inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Order form for Premium (art. 17 ust. 1–3 and art. 21 ust. 2 u.p.k.):
 * information block directly above the button, two unticked required
 * checkboxes, optional art. 7aa statement, and the "Zamawiam i płacę" button
 * that only then redirects to Stripe Checkout.
 */
export default function PremiumOrderForm({ configured }: Props) {
  const { isLoaded, isSignedIn } = useAuth();
  const [interval, setInterval] = useState<BillingInterval>("year");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [earlyStart, setEarlyStart] = useState(false);
  const [business, setBusiness] = useState<BusinessPurpose | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    void fetchCloudMe().then((me) => {
      if (!cancelled) setIsPremium(me?.plan === "premium");
    });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  const price = interval === "month" ? PREMIUM_PRICE_MONTHLY : PREMIUM_PRICE_YEARLY;
  const { period, adj } = intervalLabel(interval);
  const canOrder = acceptTerms && earlyStart && !busy;

  async function order() {
    if (!acceptTerms || !earlyStart) {
      setError("Zaznacz oba wymagane oświadczenia, aby złożyć zamówienie.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interval,
          acceptTerms,
          earlyStart,
          businessPurpose: business || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
        code?: string;
      };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.code === "already_premium") setIsPremium(true);
      setError(
        data.code === "auth_required"
          ? "Zaloguj się, aby kontynuować."
          : data.error || "Nie udało się rozpocząć płatności.",
      );
    } catch {
      setError("Błąd sieci. Spróbuj ponownie.");
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
        Płatności są chwilowo niedostępne. Napisz na{" "}
        <a className="underline" href={`mailto:${OPERATOR.email}`}>
          {OPERATOR.email}
        </a>
        .
      </p>
    );
  }

  if (isSignedIn && isPremium) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="font-semibold text-emerald-900">Masz aktywne Premium.</p>
        <p className="mt-1 text-sm text-emerald-900">
          Nie musisz kupować ponownie. Kartę, faktury i rezygnację (z końcem opłaconego okresu)
          obsłużysz w panelu subskrypcji.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ManageSubscriptionButton />
          <Link
            href="/konto"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Ustawienia konta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      <div
        className="grid grid-cols-2 gap-1 rounded-xl border border-slate-300 bg-white p-1 text-sm"
        role="radiogroup"
        aria-label="Wariant subskrypcji"
      >
        {(["month", "year"] as const).map((i) => {
          const selected = interval === i;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setInterval(i)}
              className={`min-h-12 rounded-lg px-3 py-2.5 font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                selected ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="block">
                {i === "month" ? PREMIUM_PRICE_MONTHLY : PREMIUM_PRICE_YEARLY} zł
              </span>
              <span className={`block text-xs font-normal ${selected ? "text-slate-300" : "text-slate-400"}`}>
                {i === "month" ? "/ miesiąc" : `/ rok · oszczędzasz ${YEARLY_SAVINGS} zł`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Information block directly above the order button (art. 17 ust. 1 u.p.k.) */}
      <div className="rounded-xl border border-slate-300 bg-white p-4 text-sm leading-relaxed text-slate-700">
        <p>
          <strong>
            Plan Premium — {adj}: {price} zł za {period}
          </strong>{" "}
          (cena ostateczna; sprzedawca zwolniony z VAT na podstawie art. 113 ust. 1 ustawy o VAT).
        </p>
        <p className="mt-2">
          Subskrypcja <strong>odnawia się automatycznie</strong> na kolejne takie same okresy, a
          opłata jest pobierana z góry na początku każdego okresu z podanej metody płatności,
          dopóki nie zrezygnujesz. <strong>Nie ma minimalnego okresu umowy.</strong> Możesz
          zrezygnować w każdej chwili w{" "}
          <Link href="/konto" className="underline underline-offset-2">
            Ustawieniach konta → Zarządzaj subskrypcją
          </Link>{" "}
          albo e-mailem na{" "}
          <a href={`mailto:${OPERATOR.email}`} className="underline underline-offset-2">
            {OPERATOR.email}
          </a>
          ; rezygnacja działa z końcem opłaconego okresu.
        </p>
        <p className="mt-2">
          Premium obejmuje: nielimitowaną liczbę przejazdów, eksport do Excela (.xlsx) i
          kalkulator diet krajowych. Premium aktywuje się od razu po płatności.
        </p>
      </div>

      {isLoaded && !isSignedIn ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-600">
            Zakup wymaga konta — Premium jest przypisane do konta i działa na wszystkich
            urządzeniach.
          </p>
          <SignInButton mode="modal">
            <button type="button" className={btn}>
              Zaloguj się, żeby zamówić
            </button>
          </SignInButton>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void order();
          }}
          noValidate
        >
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-400"
              aria-required="true"
            />
            <span>
              Zapoznałem(-am) się z{" "}
              <Link href="/regulamin" target="_blank" className="underline underline-offset-2">
                Regulaminem
              </Link>{" "}
              i akceptuję jego treść. Zapoznałem(-am) się z{" "}
              <Link href="/polityka-prywatnosci" target="_blank" className="underline underline-offset-2">
                Polityką prywatności
              </Link>
              . Rozumiem, że Plan Premium jest subskrypcją odnawianą automatycznie co {period} za{" "}
              {price} zł (cena ostateczna, sprzedawca zwolniony z VAT), dopóki z niej nie
              zrezygnuję; rezygnacja działa z końcem opłaconego okresu.{" "}
              <span className="text-slate-500">(wymagane)</span>
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={earlyStart}
              onChange={(e) => setEarlyStart(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-400"
              aria-required="true"
            />
            <span>
              {EARLY_START_TEXT} <span className="text-slate-500">(wymagane)</span>
            </span>
          </label>

          <fieldset className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
            <legend className="px-1 text-xs text-slate-500">
              Jeżeli kupujesz w związku z prowadzoną działalnością gospodarczą (pole
              nieobowiązkowe, art. 7aa ust. 2 ustawy o prawach konsumenta):
            </legend>
            {(Object.keys(BUSINESS_PURPOSE_LABELS) as BusinessPurpose[]).map((k) => (
              <label key={k} className="mt-1 flex items-center gap-2">
                <input
                  type="radio"
                  name="business"
                  checked={business === k}
                  onChange={() => setBusiness(k)}
                />
                {BUSINESS_PURPOSE_LABELS[k]}
              </label>
            ))}
            {business && (
              <button
                type="button"
                className="mt-1 text-xs text-slate-500 underline"
                onClick={() => setBusiness("")}
              >
                wyczyść wybór
              </button>
            )}
            <p className="mt-1 text-xs text-slate-500">
              Brak wyboru nie wpływa na możliwość złożenia zamówienia.
            </p>
          </fieldset>

          <button type="submit" disabled={!canOrder} className={btn}>
            {busy ? "Przekierowanie do płatności…" : "Zamawiam i płacę"}
          </button>
          {!acceptTerms || !earlyStart ? (
            <p className="text-xs text-slate-500">
              Przycisk będzie aktywny po zaznaczeniu obu wymaganych oświadczeń.
            </p>
          ) : null}
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <p className="text-xs leading-relaxed text-slate-500">
            Po kliknięciu przejdziesz do bezpiecznej płatności Stripe Checkout. Potwierdzenie
            płatności Stripe wyśle na Twój e-mail.
          </p>
        </form>
      )}
    </div>
  );
}
