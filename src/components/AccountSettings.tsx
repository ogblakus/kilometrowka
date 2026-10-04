"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SignInButton, useAuth, useClerk } from "@clerk/nextjs";
import EwidencjaProfileForm from "@/components/EwidencjaProfileForm";
import ManageSubscriptionButton from "@/components/ManageSubscriptionButton";
import { OPERATOR, withdrawalMailto } from "@/lib/legal";

type Me = {
  email: string | null;
  plan: "free" | "premium";
  subscription: { status: string | null; currentPeriodEnd: string | null } | null;
};

const STATUS_PL: Record<string, string> = {
  active: "aktywna",
  trialing: "okres próbny",
  past_due: "zaległa płatność (Stripe ponawia)",
  canceled: "anulowana",
  unpaid: "nieopłacona",
  incomplete: "niedokończona płatność",
  incomplete_expired: "wygasła",
  paused: "wstrzymana",
};

const card = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm";

export default function AccountSettings() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const [me, setMe] = useState<Me | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as Me;
        if (!cancelled) setMe(data);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  async function deleteAccount() {
    if (confirm.trim() !== "USUŃ") {
      setDeleteMsg("Wpisz „USUŃ”, aby potwierdzić.");
      return;
    }
    setDeleting(true);
    setDeleteMsg(null);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "USUŃ" }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; warning?: string };
      if (!res.ok || !data.ok) {
        setDeleteMsg(data.error || "Nie udało się usunąć konta.");
        return;
      }
      if (data.warning) alert(data.warning);
      await signOut({ redirectUrl: "/" });
    } catch {
      setDeleteMsg("Błąd sieci. Spróbuj ponownie.");
    } finally {
      setDeleting(false);
    }
  }

  if (!isLoaded) return <p className="text-sm text-slate-500">Ładowanie…</p>;

  if (!isSignedIn) {
    return (
      <div className={card}>
        <p className="text-sm text-slate-700">Zaloguj się, aby zobaczyć ustawienia konta.</p>
        <div className="mt-4">
          <SignInButton mode="modal">
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white"
            >
              Zaloguj się
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  const sub = me?.subscription ?? null;
  const periodEnd = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw" })
    : null;

  return (
    <div className="space-y-6">
      <section className={card} aria-labelledby="plan-h">
        <h2 id="plan-h" className="font-semibold text-slate-900">
          Plan i subskrypcja
        </h2>
        {loadError ? (
          <p className="mt-2 text-sm text-red-700">Nie udało się wczytać danych konta. Odśwież stronę.</p>
        ) : !me ? (
          <p className="mt-2 text-sm text-slate-500">Ładowanie…</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-700">
              Konto: <strong>{me.email ?? "—"}</strong> · Plan:{" "}
              <strong>{me.plan === "premium" ? "Premium" : "Free"}</strong>
              {sub?.status ? ` · subskrypcja: ${STATUS_PL[sub.status] ?? sub.status}` : ""}
              {periodEnd ? ` · bieżący okres do ${periodEnd}` : ""}
            </p>
            {sub ? (
              <div className="mt-4 space-y-3">
                <ManageSubscriptionButton />
                <p className="text-xs leading-relaxed text-slate-500">
                  W panelu Stripe anulujesz subskrypcję (działa z końcem opłaconego okresu —
                  kolejna opłata nie zostanie pobrana), zmienisz kartę i pobierzesz potwierdzenia
                  płatności. Rezygnację możesz też wysłać e-mailem na {OPERATOR.email}.
                </p>
                <a
                  href={withdrawalMailto(me.email)}
                  className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50"
                >
                  Odstąp od umowy (14 dni)
                </a>
                <p className="text-xs leading-relaxed text-slate-500">
                  Przycisk przygotowuje wiadomość e-mail z oświadczeniem o odstąpieniu (wzór z
                  Załącznika nr 1 do{" "}
                  <Link href="/regulamin" className="underline">
                    Regulaminu
                  </Link>
                  ). Potwierdzimy jej otrzymanie e-mailem.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm">
                <Link href="/kup" className="font-medium text-slate-900 underline underline-offset-2">
                  Przejdź na Premium
                </Link>
              </p>
            )}
          </>
        )}
      </section>

      <section className={card} aria-labelledby="ew-h">
        <h2 id="ew-h" className="font-semibold text-slate-900">
          Dane do ewidencji przebiegu pojazdu
        </h2>
        <div className="mt-3">
          <EwidencjaProfileForm cloud />
        </div>
      </section>

      <section className="rounded-xl border border-red-200 bg-red-50 p-5" aria-labelledby="del-h">
        <h2 id="del-h" className="font-semibold text-red-900">
          Usuń konto
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-red-900">
          Usuniemy konto logowania, wszystkie przejazdy i dane ewidencji. Tej operacji nie można
          cofnąć — najpierw wyeksportuj dane (CSV/Excel w kalkulatorze).
          {sub
            ? " Aktywna subskrypcja zostanie anulowana natychmiast, bez zwrotu za bieżący okres (z zastrzeżeniem prawa odstąpienia, § 10 Regulaminu). Jeśli wolisz korzystać z Premium do końca okresu, anuluj subskrypcję w panelu powyżej i usuń konto po jego zakończeniu."
            : ""}
        </p>
        <label className="mt-3 block text-sm text-red-900">
          Wpisz <strong>USUŃ</strong>, aby potwierdzić
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full max-w-xs rounded-lg border border-red-300 bg-white px-3 py-2 text-sm"
            autoComplete="off"
          />
        </label>
        <button
          type="button"
          onClick={() => void deleteAccount()}
          disabled={deleting || confirm.trim() !== "USUŃ"}
          className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
        >
          {deleting ? "Usuwanie…" : "Usuń konto na stałe"}
        </button>
        {deleteMsg && (
          <p className="mt-2 text-sm text-red-800" role="alert">
            {deleteMsg}
          </p>
        )}
      </section>
    </div>
  );
}
