"use client";

import { useEffect, useState } from "react";
import { loadLocalProfile, saveLocalProfile } from "@/lib/storage";
import { parseProfileBody } from "@/lib/trip-validate";
import { EMPTY_PROFILE, type EwidencjaProfile } from "@/lib/types";

type Props = {
  /** Signed-in: stored on the server (/api/profile); guest: this browser only. */
  cloud: boolean;
  onChange?: (p: EwidencjaProfile) => void;
  compact?: boolean;
};

type Errors = Partial<Record<keyof EwidencjaProfile | "form", string>>;

export async function fetchProfile(): Promise<EwidencjaProfile | null> {
  try {
    const res = await fetch("/api/profile", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { profile?: EwidencjaProfile };
    return data.profile ?? null;
  } catch {
    return null;
  }
}

/** Data required in the ewidencja przebiegu pojazdu (W3). */
export default function EwidencjaProfileForm({ cloud, onChange, compact }: Props) {
  const [form, setForm] = useState<EwidencjaProfile>(EMPTY_PROFILE);
  const [cc, setCc] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const p = cloud ? await fetchProfile() : loadLocalProfile();
      if (cancelled || !p) return;
      setForm(p);
      setCc(p.vehicleEngineCc ? String(p.vehicleEngineCc) : "");
      onChange?.(p);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloud]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaved(null);
    const parsed = parseProfileBody({ ...form, vehicleEngineCc: cc.trim() });
    if ("error" in parsed) {
      setErrors({ [parsed.field ?? "form"]: parsed.error });
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      if (cloud) {
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        });
        const data = (await res.json().catch(() => ({}))) as {
          profile?: EwidencjaProfile;
          error?: string;
          field?: keyof EwidencjaProfile;
        };
        if (!res.ok || !data.profile) {
          setErrors({ [data.field ?? "form"]: data.error || "Nie udało się zapisać." });
          return;
        }
        setForm(data.profile);
        onChange?.(data.profile);
      } else {
        saveLocalProfile(parsed);
        setForm(parsed);
        onChange?.(parsed);
      }
      setSaved("Zapisano dane do ewidencji.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400";
  const err = (k: keyof Errors) =>
    errors[k] ? (
      <span className="mt-1 block text-xs text-red-600" role="alert">
        {errors[k]}
      </span>
    ) : null;

  return (
    <form onSubmit={(e) => void save(e)} noValidate className="space-y-3">
      {!compact && (
        <p className="text-sm text-slate-600">
          Te dane trafiają do nagłówka eksportu CSV/Excel. Ewidencja przebiegu pojazdu wymaga
          m.in. danych osoby używającej pojazdu, numeru rejestracyjnego i pojemności silnika.
          {cloud ? "" : " W trybie Gościa zapisujemy je tylko w tej przeglądarce."}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-700">Imię i nazwisko</span>
          <input
            className={field}
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            placeholder="np. Jan Kowalski"
            autoComplete="name"
            aria-invalid={errors.fullName ? true : undefined}
          />
          {err("fullName")}
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Adres zamieszkania</span>
          <input
            className={field}
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="np. ul. Polna 1, 00-001 Warszawa"
            autoComplete="street-address"
            aria-invalid={errors.address ? true : undefined}
          />
          {err("address")}
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Numer rejestracyjny pojazdu</span>
          <input
            className={`${field} uppercase`}
            value={form.vehicleRegistration}
            onChange={(e) => setForm((f) => ({ ...f, vehicleRegistration: e.target.value }))}
            placeholder="np. PZ 12345"
            maxLength={12}
            aria-invalid={errors.vehicleRegistration ? true : undefined}
          />
          {err("vehicleRegistration")}
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Pojemność silnika (cm³)</span>
          <input
            className={field}
            value={cc}
            inputMode="numeric"
            onChange={(e) => setCc(e.target.value)}
            placeholder="np. 1598"
            aria-invalid={errors.vehicleEngineCc ? true : undefined}
          />
          {err("vehicleEngineCc")}
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-slate-700">Pracodawca / firma (opcjonalnie)</span>
          <input
            className={field}
            value={form.employer}
            onChange={(e) => setForm((f) => ({ ...f, employer: e.target.value }))}
            placeholder="np. ABC sp. z o.o."
            aria-invalid={errors.employer ? true : undefined}
          />
          {err("employer")}
        </label>
      </div>
      {err("form")}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-10 items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {busy ? "Zapisywanie…" : "Zapisz dane"}
        </button>
        {saved && (
          <span className="text-sm text-emerald-700" role="status">
            {saved}
          </span>
        )}
      </div>
    </form>
  );
}
