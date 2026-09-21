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
          try {
            await fetch("/api/premium/activate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ session_id: sessionId }),
            });
          } catch {
            /* local plan already set; cloud sync best-effort */
          }
          setEmail(data.customerEmail || null);
          setStatus("paid");
          return;
        }

        if (res.status === 503) {
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
          Potwierdzamy płatność. To potrwa chwilę.
        </p>
      </div>
    );
  }

  if (status === "paid") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-emerald-800">Gotowe</p>
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
          . Masz nielimitowane przejazdy, Excel i diety. Przy zalogowanym koncie plan Premium jest w chmurze i działa na wszystkich urządzeniach. </p>
        <Link
          href="/kalkulator"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
        >
          Przejdź do kalkulatora
        </Link>
      </div>
    );
  }

  if (status === "no_session") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Brak sesji płatności</h1>
        <p className="mt-3 text-sm text-slate-600">
          Nie znaleziono potwierdzenia płatności. Jeśli właśnie zapłaciłeś,
          wróć z linku sukcesu z checkoutu albo napisz na kontakt@kilometrowka.app.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/kup"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Wróć do Kup Premium
          </Link>
          <Link
            href="/kalkulator"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
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
          ? "Płatność nie została potwierdzona. Premium nie zostało odblokowane."
          : "Nie udało się zweryfikować płatności. Premium nie zostało odblokowane — spróbuj ponownie lub napisz do nas."}
      </p>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/kup"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
        >
          Spróbuj ponownie
        </Link>
        <Link
          href="/kalkulator"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Kalkulator
        </Link>
      </div>
    </div>
  );
}
