-- 000_init.sql
-- Base schema (users, trips) as it existed in production before 001.
-- Reconstructed from the production Neon schema (information_schema /
-- pg_constraint / pg_indexes, 2026-10-04). Idempotent: safe on an existing DB.
-- Apply in order: 000 → 001 → 002 → 003 … (psql "$DATABASE_URL" -f <file>).

BEGIN;

CREATE TABLE IF NOT EXISTS users (
  clerk_user_id text PRIMARY KEY,
  email text,
  plan text NOT NULL DEFAULT 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT users_plan_check CHECK (plan IN ('free', 'premium'))
);

CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL REFERENCES users (clerk_user_id) ON DELETE CASCADE,
  trip_date date NOT NULL,
  from_place text NOT NULL DEFAULT '',
  to_place text NOT NULL DEFAULT '',
  km numeric(10, 2) NOT NULL CONSTRAINT trips_km_check CHECK (km >= 0),
  purpose text NOT NULL DEFAULT '',
  vehicle text NOT NULL,
  amount_pln numeric(12, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trips_user_date_idx
  ON trips (clerk_user_id, trip_date DESC);

-- Simple migration bookkeeping (see database/README.md).
CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT NOW()
);
INSERT INTO schema_migrations (version) VALUES ('000_init') ON CONFLICT DO NOTHING;

COMMIT;
