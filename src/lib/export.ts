import type { Trip } from "./types";
import { VEHICLE_RATES } from "./rates";
import { formatDatePl } from "./format";

/**
 * Neutralize CSV/Excel formula injection for user-controlled cells.
 * Prefix apostrophe for cells starting with = + - @ or leading tab/CR/LF.
 */
function neutralizeCsvCell(value: string): string {
  if (/^[=+\-@\t\r\n]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

function escapeCsv(value: string | number): string {
  const s = neutralizeCsvCell(String(value));
  if (/[",;\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function tripsToCsv(trips: Trip[]): string {
  const header = [
    "Data",
    "Skąd",
    "Dokąd",
    "Km",
    "Cel",
    "Pojazd",
    "Stawka (zł/km)",
    "Kwota (zł)",
  ];
  const rows = trips.map((t) => {
    const rate = VEHICLE_RATES[t.vehicle];
    return [
      formatDatePl(t.date),
      t.from,
      t.to,
      t.km.toFixed(1).replace(".", ","),
      t.purpose,
      rate.label,
      rate.rate.toFixed(2).replace(".", ","),
      t.amount.toFixed(2).replace(".", ","),
    ]
      .map(escapeCsv)
      .join(";");
  });
  // BOM for Excel UTF-8
  return "\uFEFF" + [header.join(";"), ...rows].join("\n");
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCsv(trips: Trip[]): void {
  const csv = tripsToCsv(trips);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `ewidencja-kilometrowka-${stamp}.csv`);
}

/**
 * Download Excel (.xlsx) generated server-side by GET /api/export/xlsx.
 * The endpoint checks the Premium plan in Neon; returns an error message
 * (Polish) on failure, or null on success.
 */
export async function exportXlsx(monthKey?: string): Promise<string | null> {
  const q = monthKey ? `?month=${encodeURIComponent(monthKey)}` : "";
  try {
    const res = await fetch(`/api/export/xlsx${q}`);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      return data.error || "Nie udało się wygenerować pliku Excel.";
    }
    const blob = await res.blob();
    const stamp = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `ewidencja-kilometrowka-${stamp}.xlsx`);
    return null;
  } catch {
    return "Błąd sieci. Spróbuj ponownie.";
  }
}
