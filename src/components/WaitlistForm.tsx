"use client";

import { FormEvent, useState } from "react";
import { saveWaitlistEmail } from "@/lib/storage";

interface Props {
  successMessage?: string;
  buttonLabel?: string;
}

export default function WaitlistForm({
  successMessage = "Dziękujemy! Zapisaliśmy Twój e-mail lokalnie w tej przeglądarce. Dam znać, gdy płatności będą aktywne.",
  buttonLabel = "Zapisz się",
}: Props) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Podaj prawidłowy adres e-mail.");
      return;
    }
    saveWaitlistEmail(trimmed);
    setDone(true);
    setEmail("");
  }

  if (done) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        {successMessage}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="relative flex flex-col gap-2 sm:flex-row">
      <label className="sr-only" htmlFor="waitlist-email">
        Adres e-mail
      </label>
      <input
        id="waitlist-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="twoj@email.pl"
        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-400"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "waitlist-error" : undefined}
      />
      <button
        type="submit"
        className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
      >
        {buttonLabel}
      </button>
      {error && (
        <p id="waitlist-error" className="w-full text-xs text-red-600 sm:basis-full">
          {error}
        </p>
      )}
    </form>
  );
}
