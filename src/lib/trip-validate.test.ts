import { describe, expect, it } from "vitest";
import {
  isTripDateInRange,
  isUuid,
  parseAndValidateTripBody,
  TRIP_DATE_MIN,
  tripDateMax,
  todayWarsawIso,
} from "./trip-validate";

// 2026-10-01 10:00 Warsaw (08:00 UTC)
const NOW = new Date("2026-10-01T08:00:00Z");

const base = {
  date: "2026-09-15",
  from: "Warszawa",
  to: "Kraków",
  km: 300,
  purpose: "Spotkanie",
  vehicle: "samochod_ponad_900",
};

function parse(over: Record<string, unknown>) {
  return parseAndValidateTripBody({ ...base, ...over }, NOW);
}

describe("isUuid", () => {
  it("accepts canonical UUIDs", () => {
    expect(isUuid("3f1c2a4e-9b7d-4c1e-8a2b-1234567890ab")).toBe(true);
    expect(isUuid("3F1C2A4E-9B7D-4C1E-8A2B-1234567890AB")).toBe(true);
  });
  it("rejects non-UUIDs", () => {
    for (const v of ["", "abc", "t-123-xyz", "1", "3f1c2a4e9b7d4c1e8a2b1234567890ab", null, 5, undefined]) {
      expect(isUuid(v)).toBe(false);
    }
  });
});

describe("trip date range", () => {
  it("today in Warsaw is timezone-aware", () => {
    // 2026-09-30 22:30 UTC = 2026-10-01 00:30 Warsaw
    expect(todayWarsawIso(new Date("2026-09-30T22:30:00Z"))).toBe("2026-10-01");
  });
  it("max is today + 1 year", () => {
    expect(tripDateMax(NOW)).toBe("2027-10-01");
  });
  it("Feb 29 + 1 year clamps to Feb 28", () => {
    expect(tripDateMax(new Date("2028-02-29T12:00:00Z"))).toBe("2029-02-28");
  });
  it("bounds are inclusive", () => {
    expect(isTripDateInRange(TRIP_DATE_MIN, NOW)).toBe(true);
    expect(isTripDateInRange("1999-12-31", NOW)).toBe(false);
    expect(isTripDateInRange("2027-10-01", NOW)).toBe(true);
    expect(isTripDateInRange("2027-10-02", NOW)).toBe(false);
  });
  it("rejects far past / far future dates in body", () => {
    for (const date of ["0001-01-01", "1999-12-31", "2027-10-02", "9999-12-31"]) {
      const r = parse({ date });
      expect("error" in r).toBe(true);
    }
  });
  it("accepts in-range dates", () => {
    for (const date of ["2000-01-01", "2026-10-01", "2027-10-01"]) {
      const r = parse({ date });
      expect("error" in r).toBe(false);
    }
  });
  it("still rejects invalid calendar dates", () => {
    expect("error" in parse({ date: "2026-02-30" })).toBe(true);
    expect("error" in parse({ date: "2026-9-1" })).toBe(true);
  });
});

describe("km validation after rounding", () => {
  it("rejects km that round to 0 (0.01–0.04)", () => {
    for (const km of [0.01, 0.04, "0.049"]) {
      const r = parse({ km });
      expect(r).toEqual({ error: expect.stringContaining("km") });
    }
  });
  it("accepts 0.05 (rounds to 0.1)", () => {
    const r = parse({ km: 0.05 });
    expect("error" in r ? r.error : r.km).toBe(0.1);
  });
  it("rejects zero, negative, NaN, huge", () => {
    for (const km of [0, -1, "abc", Infinity, 1_000_001]) {
      expect("error" in parse({ km })).toBe(true);
    }
  });
  it("recomputes amount server-side, ignoring client amount", () => {
    const r = parse({ km: 100, amount: 999999 });
    expect("error" in r).toBe(false);
    if (!("error" in r)) {
      expect(r.km).toBe(100);
      expect(r.amount).toBeLessThan(1000);
    }
  });
});
