"use client";

import { useState } from "react";

/** Opens the Stripe Customer Portal (cancel at period end, card, invoices). */
export default function ManageSubscriptionButton({
  label = "Zarządzaj subskrypcją / anuluj",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error || "Nie udało się otworzyć panelu subskrypcji.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Błąd sieci. Spróbuj ponownie.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void open()}
        disabled={busy}
        className={
          className ||
          "inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-60"
        }
      >
        {busy ? "Otwieranie…" : label}
      </button>
      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
