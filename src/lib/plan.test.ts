import { describe, expect, it } from "vitest";
import { FREE_TRIPS_PER_MONTH, isWithinFreeQuota } from "./plan";

describe("isWithinFreeQuota", () => {
  it("keeps the Free limit at 10 (UI copy depends on it)", () => {
    expect(FREE_TRIPS_PER_MONTH).toBe(10);
  });
  it("free: allows below limit, blocks at/above", () => {
    expect(isWithinFreeQuota("free", 0)).toBe(true);
    expect(isWithinFreeQuota("free", FREE_TRIPS_PER_MONTH - 1)).toBe(true);
    expect(isWithinFreeQuota("free", FREE_TRIPS_PER_MONTH)).toBe(false);
    expect(isWithinFreeQuota("free", FREE_TRIPS_PER_MONTH + 5)).toBe(false);
  });
  it("premium: never blocked", () => {
    expect(isWithinFreeQuota("premium", 10_000)).toBe(true);
  });
});
