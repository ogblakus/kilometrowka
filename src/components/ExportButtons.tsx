"use client";

import { useState } from "react";
import { exportCsv, exportXlsx } from "@/lib/export";
import type { Trip } from "@/lib/types";

interface Props {
  trips: Trip[];
  /** Server plan (Neon) says Premium; the export itself is re-checked server-side. */
  canExcel: boolean;
  /** Month filter (YYYY-MM) applied to the server-side Excel export. */
  monthKey?: string;
  onExcelBlocked?: () => void;
  onError?: (message: string) => void;
}

export default function ExportButtons({
  trips,
  canExcel,
  monthKey,
  onExcelBlocked,
  onError,
}: Props) {
  const [busy, setBusy] = useState(false);
  const empty = trips.length === 0;

  async function onXlsx() {
    if (!canExcel) {
      onExcelBlocked?.();
      return;
    }
    if (empty || busy) return;
    setBusy(true);
    try {
      const err = await exportXlsx(monthKey || undefined);
      if (err) onError?.(err);
    } finally {
      setBusy(false);
    }
  }

  const base =
    "inline-flex min-h-10 items-center rounded-lg border px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2";
  const enabled =
    "border-slate-300 bg-white text-slate-800 hover:bg-slate-50";
  const disabledCls =
    "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={empty}
        onClick={() => exportCsv(trips)}
        title={empty ? "Dodaj przejazdy, aby eksportować" : "Pobierz CSV"}
        className={`${base} ${empty ? disabledCls : enabled}`}
      >
        Eksport CSV
      </button>
      <button
        type="button"
        disabled={empty && canExcel}
        onClick={onXlsx}
        title={
          !canExcel
            ? "Excel dostępny w Premium"
            : empty
              ? "Dodaj przejazdy, aby eksportować"
              : "Pobierz Excel"
        }
        className={`${base} ${
          !canExcel
            ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
            : empty || busy
              ? disabledCls
              : enabled
        }`}
      >
        {busy
          ? "Generuję…"
          : canExcel
            ? "Eksport Excel (.xlsx)"
            : "Excel — Premium"}
      </button>
    </div>
  );
}
