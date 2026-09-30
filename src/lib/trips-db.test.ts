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
};

const norm = (s: string) => s.replace(/\s+/g, " ");

describe("createTripWithQuota", () => {
  beforeEach(() => {
    captured.queries = [];
    captured.insertRows = [];
  });

  it("locks per user, then conditionally inserts in one READ COMMITTED transaction", async () => {
    await createTripWithQuota("user_1", input, 10);
    expect(captured.opts).toEqual({ isolationLevel: "ReadCommitted" });
    expect(captured.queries).toHaveLength(2);
    const [lock, insert] = captured.queries;
    expect(lock.text).toContain("pg_advisory_xact_lock");
    expect(lock.values).toContain("trips:user_1");
    const sql = norm(insert.text);
    expect(sql).toMatch(/INSERT INTO trips .* SELECT .* WHERE/);
    // counts by created_at in the Warsaw month, never by trip_date
    expect(sql).toContain("created_at >= ( date_trunc('month', NOW() AT TIME ZONE 'Europe/Warsaw') AT TIME ZONE 'Europe/Warsaw' )");
    expect(sql).not.toMatch(/to_char\(trip_date/);
    // plan read from users table inside the statement
    expect(sql).toContain("FROM users WHERE clerk_user_id =");
    expect(sql).toContain("= 'premium'");
    expect(insert.values).toContain(10);
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
    expect(r).toMatchObject({ ok: true, trip: { km: 10, amount: 6.9 } });
  });
});
