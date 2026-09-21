"use client";

import { SignInButton } from "@clerk/nextjs";
import type { Trip } from "@/lib/types";

type Props = {
  isSignedIn: boolean | undefined;
  cloudMode: boolean;
  syncing: boolean;
  importOffer: Trip[] | null;
  onImport: () => void;
  onDismissImport: () => void;
};

export default function CloudSyncBanners({
  isSignedIn,
  cloudMode,
  syncing,
  importOffer,
  onImport,
  onDismissImport,
}: Props) {
  return (
    <>
      {!isSignedIn && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          <p className="font-medium">
            Zaloguj się, żeby mieć dane na wszystkich urządzeniach
          </p>
          <p className="mt-1 text-amber-900/90">
            Bez konta ewidencja zostaje tylko w localStorage tej przeglądarki
            (tryb gościa).
          </p>
          <SignInButton mode="modal">
            <button
              type="button"
              className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Zaloguj się / załóż konto
            </button>
          </SignInButton>
        </div>
      )}

      {isSignedIn && cloudMode && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
        >
          Synchronizacja w chmurze aktywna
          {syncing ? " · aktualizacja…" : ""}. Plan i przejazdy są powiązane z
          Twoim kontem Clerk.
        </div>
      )}

      {importOffer && importOffer.length > 0 && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          <p className="font-medium">
            Znaleziono {importOffer.length} przejazd(ów) lokalnie w tej
            przeglądarce.
          </p>
          <p className="mt-1">
            Zaimportować je raz do chmury? (później możesz dodać ręcznie)
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={syncing}
              onClick={onImport}
              className="inline-flex min-h-10 items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              Importuj do chmury
            </button>
            <button
              type="button"
              onClick={onDismissImport}
              className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800"
            >
              Pomiń
            </button>
          </div>
        </div>
      )}
    </>
  );
}
