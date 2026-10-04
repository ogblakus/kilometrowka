import { buildEwidencja, EWIDENCJA_COLUMNS } from "./ewidencja";
import type { EwidencjaProfile, Trip } from "./types";

/**
 * Neutralize CSV/Excel formula injection for user-controlled cells.
 * Prefix apostrophe for cells starting with = + - @ or leading tab/CR/LF.
 */
export function neutralizeCsvCell(value: string): string {
  if (/^[=+\-@\t\r\n]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

function escapeCsv(value: string | number): string {
  const s = typeof value === "number" ? String(value) : neutralizeCsvCell(value);
  if (/[",;\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const num = (n: number, digits: number) => n.toFixed(digits).replace(".", ",");

/** CSV (UTF-8 BOM, `;`) of the ewidencja: header block, table, totals, signatures. */
export function tripsToCsv(
  trips: Trip[],
  profile: EwidencjaProfile | null = null,
  monthKey?: string,
): string {
  const e = buildEwidencja(trips, profile, monthKey);
  const line = (cells: Array<string | number>) => cells.map(escapeCsv).join(";");
  const out: string[] = [];
  out.push(line([e.title]));
  for (const [k, v] of e.meta) out.push(line([k, v]));
  out.push("");
  out.push(line([...EWIDENCJA_COLUMNS]));
  for (const r of e.rows) {
    out.push(
      line([
        r.lp,
        r.date,
        r.route,
        r.purpose,
        num(r.km, 1),
        r.vehicle,
        num(r.rate, r.rate * 100 === Math.round(r.rate * 100) ? 2 : 4),
        num(r.amount, 2),
      ]),
    );
  }
  out.push(line(["", "", "", "RAZEM", num(e.totals.km, 1), "", "", num(e.totals.amount, 2)]));
  out.push("");
  for (const f of e.footer) out.push(line([f]));
  // BOM for Excel UTF-8
  return "\uFEFF" + out.join("\n");
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCsv(
  trips: Trip[],
  profile: EwidencjaProfile | null = null,
  monthKey?: string,
): void {
  const csv = tripsToCsv(trips, profile, monthKey);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `ewidencja-kilometrowka-${monthKey || stamp}.csv`);
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
    downloadBlob(blob, `ewidencja-kilometrowka-${monthKey || stamp}.xlsx`);
    return null;
  } catch {
    return "Błąd sieci. Spróbuj ponownie.";
  }
}
