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

export async function exportXlsx(trips: Trip[]): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Kilometrówka.app";
  wb.created = new Date();

  const ws = wb.addWorksheet("Ewidencja", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  ws.columns = [
    { header: "Data", key: "date", width: 12 },
    { header: "Skąd", key: "from", width: 20 },
    { header: "Dokąd", key: "to", width: 20 },
    { header: "Km", key: "km", width: 10 },
    { header: "Cel", key: "purpose", width: 28 },
    { header: "Pojazd", key: "vehicle", width: 28 },
    { header: "Stawka (zł/km)", key: "rate", width: 14 },
    { header: "Kwota (zł)", key: "amount", width: 12 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };

  for (const t of trips) {
    const rate = VEHICLE_RATES[t.vehicle];
    // Prefix formula-like strings so Excel does not execute them
    const safe = (s: string) => (/^[=+\-@\t\r\n]/.test(s) ? `'${s}` : s);
    ws.addRow({
      date: formatDatePl(t.date),
      from: safe(t.from),
      to: safe(t.to),
      km: t.km,
      purpose: safe(t.purpose),
      vehicle: rate.label,
      rate: rate.rate,
      amount: t.amount,
    });
  }

  const totals = trips.reduce(
    (acc, t) => {
      acc.km += t.km;
      acc.amount += t.amount;
      return acc;
    },
    { km: 0, amount: 0 }
  );

  const totalRow = ws.addRow({
    date: "",
    from: "",
    to: "RAZEM",
    km: Math.round(totals.km * 10) / 10,
    purpose: "",
    vehicle: "",
    rate: "",
    amount: Math.round(totals.amount * 100) / 100,
  });
  totalRow.font = { bold: true };

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `ewidencja-kilometrowka-${stamp}.xlsx`);
}
