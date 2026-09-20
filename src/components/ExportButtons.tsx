"use client";

import { useState } from "react";
import { exportCsv, exportXlsx } from "@/lib/export";
import type { Trip } from "@/lib/types";

interface Props {
  trips: Trip[];
}

export default function ExportButtons({ trips }: Props) {
  const [busy, setBusy] = useState(false);
  const disabled = trips.length === 0 || busy;

  async function onXlsx() {
    setBusy(true);
    try {
      await exportXlsx(trips);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => exportCsv(trips)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Eksport CSV
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onXlsx}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Generuję…" : "Eksport Excel (.xlsx)"}
      </button>
    </div>
  );
}
