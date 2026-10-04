import { beforeEach, describe, expect, it, vi } from "vitest";

type Q = { text: string; values: unknown[] };
const captured: { queries: Q[]; opts: unknown; insertRows: unknown[] } = {
  queries: [],
  opts: undefined,
  insertRows: [],
};

vi.mock("@/lib/db", () => {
  const tag = (strings: TemplateStringsArray, ...values: unknown[]): Q => ({
    text: strings.join("$?"),
    values,
  });
  const db = Object.assign(tag, {
    transaction: async (fn: (tx: typeof tag) => Q[], opts: unknown) => {
      captured.queries = fn(tag);
      captured.opts = opts;
      return [[], captured.insertRows];
    },
  });
  return { getDb: () => db };
});

import { createTripWithQuota } from "./trips-db";

const input = {
  date: "2026-10-01",
  from: "A",
  to: "B",
  km: 10,
  purpose: "x",
  vehicle: "motocykl" as const,
  amount: 6.9,
  rate: 0.69,
};

const norm = (s: string) => s.replace(/\s+/g, " ");

describe("createTripWithQuota", () => {
  beforeEach(() => {
    captured.queries = [];
    captured.insertRows = [];
  });

  it("locks per user, conditionally inserts and bumps the quota counter in one transaction", async () => {
    await createTripWithQuota("user_1", input, 10);
    expect(captured.opts).toEqual({ isolationLevel: "ReadCommitted" });
    expect(captured.queries).toHaveLength(3);
    const [lock, insert, quota] = captured.queries;
    expect(lock.text).toContain("pg_advisory_xact_lock");
    expect(lock.values).toContain("trips:user_1");
    const sql = norm(insert.text);
    expect(sql).toMatch(/INSERT INTO trips .* SELECT .* WHERE/);
    // quota = trips CREATED this Warsaw month (trip_quota), not current row count:
    // deleting and re-adding a trip does not free the Free quota (audit S2)
    expect(sql).toContain("FROM trip_quota");
    expect(sql).toContain("date_trunc('month', NOW() AT TIME ZONE 'Europe/Warsaw')");
    expect(sql).not.toMatch(/to_char\(trip_date/);
    // effective Premium (incl. period-end grace) read inside the statement
    expect(sql).toContain("FROM users WHERE clerk_user_id =");
    expect(sql).toContain("= 'premium'");
    expect(sql).toContain("current_period_end");
    expect(insert.values).toContain(10);
    // rate snapshot stored with the trip
    expect(sql).toContain("rate_pln_per_km");
    expect(insert.values).toContain(0.69);
    const q = norm(quota.text);
    expect(q).toContain("INSERT INTO trip_quota");
    expect(q).toContain("ON CONFLICT (clerk_user_id, month) DO UPDATE SET created_count = trip_quota.created_count + 1");
    expect(q).toContain("WHERE EXISTS (SELECT 1 FROM trips WHERE id =");
  });

  it("returns quota when the conditional insert inserts nothing", async () => {
    const r = await createTripWithQuota("user_1", input, 10);
    expect(r).toEqual({ ok: false, reason: "quota" });
  });

  it("returns the trip when inserted, using provided id", async () => {
    captured.insertRows = [
      {
        id: "3f1c2a4e-9b7d-4c1e-8a2b-1234567890ab",
        trip_date: "2026-10-01",
        from_place: "A",
        to_place: "B",
        km: "10.0",
        purpose: "x",
        vehicle: "motocykl",
        amount_pln: "6.90",
        rate_pln_per_km: "0.6900",
      },
    ];
    const r = await createTripWithQuota(
      "user_1",
      input,
      10,
      "3f1c2a4e-9b7d-4c1e-8a2b-1234567890ab",
    );
    expect(captured.queries[1].values[0]).toBe(
      "3f1c2a4e-9b7d-4c1e-8a2b-1234567890ab",
    );
    expect(r).toMatchObject({ ok: true, trip: { km: 10, amount: 6.9, rate: 0.69 } });
  });
});
