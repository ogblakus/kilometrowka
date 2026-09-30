import "server-only";
import ExcelJS from "exceljs";
import { formatDatePl } from "./format";
import { VEHICLE_RATES } from "./rates";
import type { Trip } from "./types";

/** Build the Excel workbook server-side (Premium-gated in /api/export/xlsx). */
export async function buildTripsXlsx(trips: Trip[]): Promise<Buffer> {
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
  return Buffer.from(buffer as ArrayBuffer);
}
