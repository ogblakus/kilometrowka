import { describe, expect, it } from "vitest";
import { validateDietaInput } from "./dieta-validate";
import { buildEwidencja, missingProfileFields } from "./ewidencja";
import { tripsToCsv } from "./export";
import { calcTripAmount, getRateForDate } from "./rates";
import { buildCsp, clerkFrontendHost, securityHeaders } from "./security-headers";
import { parseProfileBody, parseAndValidateTripBody } from "./trip-validate";
import { effectivePlan } from "./users";
import { windowStart } from "./rate-limit";
import { parseLegalMarkdown } from "@/components/LegalMarkdown";
import { REGULAMIN_MD } from "@/content/regulamin";
import { POLITYKA_PRYWATNOSCI_MD } from "@/content/polityka-prywatnosci";
import type { EwidencjaProfile, Trip } from "./types";

const profile: EwidencjaProfile = {
  fullName: "Jan Kowalski",
  address: "ul. Prosta 1, 00-001 Warszawa",
  employer: "",
  vehicleRegistration: "PO 12345",
  vehicleEngineCc: 1598,
};

const trip = (over: Partial<Trip>): Trip => ({
  id: "t",
  date: "2026-10-02",
  from: "Poznań",
  to: "Swarzędz",
  km: 10,
  purpose: "Spotkanie",
  vehicle: "samochod_ponad_900",
  amount: 11.5,
  ...over,
});

describe("versioned rates", () => {
  it("uses the rate valid on the trip date", () => {
    expect(getRateForDate("samochod_ponad_900", "2026-10-01")).toBe(1.15);
    expect(getRateForDate("samochod_ponad_900", "2023-01-17")).toBe(1.15);
    expect(getRateForDate("samochod_ponad_900", "2023-01-16")).toBe(0.8358);
    expect(getRateForDate("motorower")).toBe(0.42);
  });
  it("calcTripAmount accepts an explicit rate snapshot", () => {
    expect(calcTripAmount(10, "motocykl", 0.5)).toBe(5);
    expect(calcTripAmount(10, "motocykl", "2026-01-01")).toBe(6.9);
  });
});

describe("ewidencja export", () => {
  it("numbers rows chronologically and uses the stored rate snapshot", () => {
    const e = buildEwidencja(
      [trip({ id: "b", date: "2026-10-05" }), trip({ id: "a", date: "2026-10-01", rate: 1.0, amount: 10 })],
      profile,
      "2026-10",
    );
    expect(e.rows.map((r) => r.lp)).toEqual([1, 2]);
    expect(e.rows[0].rate).toBe(1.0);
    expect(e.rows[1].rate).toBe(1.15);
    expect(e.totals).toEqual({ km: 20, amount: 21.5 });
    const meta = Object.fromEntries(e.meta);
    expect(meta["Numer rejestracyjny pojazdu"]).toBe("PO 12345");
    expect(meta["Pojemność silnika (cm³)"]).toBe("1598");
    expect(meta["Imię i nazwisko osoby używającej pojazdu"]).toBe("Jan Kowalski");
  });
  it("CSV contains header block, Lp. column, totals and neutralises formulas", () => {
    const csv = tripsToCsv([trip({ purpose: "=HYPERLINK(1)" })], profile, "2026-10");
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Lp.");
    expect(csv).toContain("PO 12345");
    expect(csv).toContain("RAZEM");
    expect(csv).not.toMatch(/;"?=HYPERLINK/);
  });
  it("reports missing profile fields", () => {
    expect(missingProfileFields(null).length).toBeGreaterThan(0);
    expect(missingProfileFields(profile)).toEqual([]);
  });
});

describe("validation", () => {
  it("profile: normalises registration and rejects bad input", () => {
    const ok = parseProfileBody({ ...profile, vehicleRegistration: " po  12345 " });
    expect(ok).toMatchObject({ vehicleRegistration: "PO 12345" });
    expect(parseProfileBody({ ...profile, vehicleEngineCc: -1 })).toMatchObject({ field: "vehicleEngineCc" });
    expect(parseProfileBody({ ...profile, vehicleRegistration: "<script>" })).toMatchObject({ field: "vehicleRegistration" });
    expect(parseProfileBody({ ...profile, fullName: "x".repeat(201) })).toMatchObject({ field: "fullName" });
  });
  it("trip: rate is computed server-side from the trip date", () => {
    const r = parseAndValidateTripBody({
      date: "2026-10-01",
      from: "A",
      to: "B",
      km: 10,
      purpose: "x",
      vehicle: "motocykl",
    });
    expect(r).toMatchObject({ rate: 0.69, amount: 6.9 });
  });
  it("dieta: per-field messages", () => {
    const r = validateDietaInput({ startDate: "", startTime: "08:00", endDate: "2026-10-01", endTime: "x" });
    expect("errors" in r && r.errors.startDate).toBeTruthy();
    expect("errors" in r && r.errors.endTime).toBeTruthy();
    const back = validateDietaInput({
      startDate: "2026-10-02",
      startTime: "08:00",
      endDate: "2026-10-01",
      endTime: "08:00",
    });
    expect("errors" in back && back.errors.end).toMatch(/później/);
  });
});

describe("effectivePlan (period-end grace)", () => {
  const now = new Date("2026-10-04T12:00:00Z");
  it("keeps Premium until period end + 3 days", () => {
    expect(effectivePlan("premium", "2026-10-02T12:00:00Z", now)).toBe("premium");
    expect(effectivePlan("premium", "2026-09-30T12:00:00Z", now)).toBe("free");
    expect(effectivePlan("premium", null, now)).toBe("premium");
    expect(effectivePlan("free", "2027-01-01T00:00:00Z", now)).toBe("free");
  });
});

describe("rate limit window", () => {
  it("aligns to fixed windows", () => {
    expect(windowStart(125_000, 60).getTime()).toBe(120_000);
  });
});

describe("security headers", () => {
  const pk = "pk_test_" + Buffer.from("precise-pegasus-8487.clerk.accounts.dev$").toString("base64");
  it("decodes the Clerk Frontend API host", () => {
    expect(clerkFrontendHost(pk)).toBe("precise-pegasus-8487.clerk.accounts.dev");
    expect(clerkFrontendHost("nope")).toBeNull();
  });
  it("production CSP forbids framing and eval, allows Clerk + Turnstile", () => {
    const csp = buildCsp({ publishableKey: pk });
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("https://precise-pegasus-8487.clerk.accounts.dev");
    expect(csp).toContain("https://challenges.cloudflare.com");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("object-src 'none'");
  });
  it("sets the standard headers", () => {
    const h = Object.fromEntries(
      securityHeaders({ NODE_ENV: "production" } as NodeJS.ProcessEnv).map((x) => [x.key, x.value]),
    );
    expect(h["X-Frame-Options"]).toBe("DENY");
    expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["Permissions-Policy"]).toContain("camera=()");
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
  });
});

describe("legal documents", () => {
  for (const [name, md] of [
    ["regulamin", REGULAMIN_MD],
    ["polityka", POLITYKA_PRYWATNOSCI_MD],
  ] as const) {
    it(`${name}: no placeholders, no dead domain, operator data present`, () => {
      expect(md).not.toMatch(/UZUPEŁNIJ/);
      expect(md).not.toContain("kontakt@kilometrowka.app");
      expect(md).not.toMatch(/Faktura VAT/i);
      expect(md).toContain("7773431444");
      expect(md).toContain("djpablo312@icloud.com");
      const blocks = parseLegalMarkdown(md);
      expect(blocks.some((b) => b.t === "h")).toBe(true);
    });
  }
  it("regulamin has withdrawal section and model form; policy has the cookie table", () => {
    expect(REGULAMIN_MD).toContain("Prawo odstąpienia od umowy");
    expect(REGULAMIN_MD).toContain("Załącznik nr 1");
    const tables = parseLegalMarkdown(POLITYKA_PRYWATNOSCI_MD).filter((b) => b.t === "table");
    expect(tables.length).toBeGreaterThanOrEqual(3);
  });
});
