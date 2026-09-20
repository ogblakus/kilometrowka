"use client";

import { FormEvent, useState } from "react";
import { saveWaitlistEmail } from "@/lib/storage";

export default function WaitlistForm() {
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
        Dziękujemy! Zapisaliśmy Twój e-mail lokalnie w tej przeglądarce.
        Powiadomimy Cię, gdy pojawi się plan roczny.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="twoj@email.pl"
        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-slate-400 focus:ring-2"
        aria-label="Adres e-mail"
      />
      <button
        type="submit"
        className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
      >
        Dołącz do listy
      </button>
      {error && (
        <p className="w-full text-xs text-red-600 sm:absolute sm:mt-12">{error}</p>
      )}
    </form>
  );
}
