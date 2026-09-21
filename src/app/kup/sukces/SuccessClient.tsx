"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { savePlan } from "@/lib/plan";

type Status = "checking" | "paid" | "unpaid" | "no_session" | "error";

export default function SuccessClient() {
  const search = useSearchParams();
  const sessionId = search.get("session_id")?.trim() || "";
  const [status, setStatus] = useState<Status>(
    sessionId ? "checking" : "no_session",
  );
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`,
        );
        const data = (await res.json()) as {
          paid?: boolean;
          customerEmail?: string;
          error?: string;
        };

        if (cancelled) return;

        if (res.ok && data.paid) {
          savePlan("premium");
          window.dispatchEvent(new Event("kilometrowka:plan"));
          setEmail(data.customerEmail || null);
          setStatus("paid");
          return;
        }

        // Sesja niepotwierdzona — nie udajemy płatności
        if (res.status === 503) {
          // Stripe nie skonfigurowany lokalnie — i tak nie odblokowujemy
          setStatus("error");
          return;
        }
        setStatus("unpaid");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (status === "checking") {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Weryfikacja płatności…
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Sprawdzamy sesję Stripe. To potrwa chwilę.
        </p>
      </div>
    );
  }

  if (status === "paid") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-emerald-800">Sukces</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Premium odblokowane
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          Dziękujemy za zakup
          {email ? (
            <>
              {" "}
              (<span className="font-medium">{email}</span>)
            </>
          ) : null}
          . Plan Premium zapisaliśmy w tej przeglądarce (localStorage). Możesz
          korzystać z nielimitowanych przejazdów, Excel i diet.
        </p>
        <Link
          href="/kalkulator"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
        >
          Przejdź do kalkulatora
        </Link>
      </div>
    );
  }

  if (status === "no_session") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Brak sesji</h1>
        <p className="mt-3 text-sm text-slate-600">
          Nie znaleziono parametru sesji Stripe. Jeśli właśnie zapłaciłeś,
          wróć z linku sukcesu z checkoutu albo skontaktuj się z nami.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/kup"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Wróć do Kup Premium
          </Link>
          <Link
            href="/kalkulator"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Kalkulator
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">
        Nie potwierdzono płatności
      </h1>
      <p className="mt-3 text-sm text-slate-700">
        {status === "unpaid"
          ? "Sesja Stripe nie ma statusu opłaconej. Premium nie zostało odblokowane — nie udajemy płatności."
          : "Nie udało się zweryfikować sesji (błąd sieci lub konfiguracji). Premium nie zostało odblokowane."}
      </p>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/kup"
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
        >
          Spróbuj ponownie
        </Link>
        <Link
          href="/kalkulator"
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Kalkulator
        </Link>
      </div>
    </div>
  );
}
