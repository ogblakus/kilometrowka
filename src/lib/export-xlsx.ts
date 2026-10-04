import "server-only";
import ExcelJS from "exceljs";
import { buildEwidencja, EWIDENCJA_COLUMNS } from "./ewidencja";
import type { EwidencjaProfile, Trip } from "./types";

/**
 * Build the Excel ewidencja server-side (Premium-gated in /api/export/xlsx).
 * ExcelJS writes strings as text (never formulas), so no apostrophe prefix
 * is needed here (audit N7) — that neutralisation is CSV-only.
 */
export async function buildTripsXlsx(
  trips: Trip[],
  profile: EwidencjaProfile | null = null,
  monthKey?: string,
): Promise<Buffer> {
  const e = buildEwidencja(trips, profile, monthKey);
  const wb = new ExcelJS.Workbook();
  wb.creator = "Kilometrówka.app";
  wb.created = new Date();

  const ws = wb.addWorksheet("Ewidencja", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  ws.columns = [
    { key: "lp", width: 6 },
    { key: "date", width: 13 },
    { key: "route", width: 34 },
    { key: "purpose", width: 30 },
    { key: "km", width: 10 },
    { key: "vehicle", width: 26 },
    { key: "rate", width: 12 },
    { key: "amount", width: 13 },
  ];

  const title = ws.addRow([e.title]);
  title.font = { bold: true, size: 14 };
  for (const [k, v] of e.meta) {
    const r = ws.addRow([k, "", v]);
    ws.mergeCells(r.number, 1, r.number, 2);
    r.getCell(1).font = { bold: true };
  }
  ws.addRow([]);

  const header = ws.addRow([...EWIDENCJA_COLUMNS]);
  header.font = { bold: true };
  header.alignment = { wrapText: true, vertical: "middle" };
  header.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    c.border = { bottom: { style: "thin" } };
  });
  ws.views = [{ state: "frozen", ySplit: header.number }];

  for (const r of e.rows) {
    const row = ws.addRow([r.lp, r.date, r.route, r.purpose, r.km, r.vehicle, r.rate, r.amount]);
    row.getCell(5).numFmt = "0.0";
    row.getCell(7).numFmt = "0.00##";
    row.getCell(8).numFmt = "#,##0.00";
  }

  const total = ws.addRow(["", "", "", "RAZEM", e.totals.km, "", "", e.totals.amount]);
  total.font = { bold: true };
  total.getCell(5).numFmt = "0.0";
  total.getCell(8).numFmt = "#,##0.00";
  total.eachCell((c) => {
    c.border = { top: { style: "thin" } };
  });

  ws.addRow([]);
  for (const f of e.footer) ws.addRow([f]);

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}
