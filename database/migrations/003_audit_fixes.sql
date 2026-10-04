-- 003_audit_fixes.sql
-- Idempotent. Audit 2026-10-04:
--  * trips.rate_pln_per_km — rate snapshot per trip (S4);
--  * users: ewidencja profile (W3) — person, address, vehicle registration,
--    engine capacity, employer;
--  * trip_quota — monthly CREATE counter, so delete + re-add does not reset
--    the Free quota (S2);
--  * rate_limits — fixed-window API rate limiting without extra services (W4);
--  * checkout_consents — evidence of the /kup statements (art. 17, 21 u.p.k.);
--  * stripe_events.status — insert-first webhook idempotency (N3).
-- All changes are additive, so the previous app version keeps working.

BEGIN;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT NOW()
);
INSERT INTO schema_migrations (version) VALUES
  ('000_init'), ('001_security_hardening'), ('002_trip_quota_created_at')
ON CONFLICT DO NOTHING;

-- trips: rate snapshot ------------------------------------------------------
ALTER TABLE trips ADD COLUMN IF NOT EXISTS rate_pln_per_km numeric(8, 4);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trips_rate_check' AND conrelid = 'public.trips'::regclass
  ) THEN
    ALTER TABLE trips ADD CONSTRAINT trips_rate_check
      CHECK (rate_pln_per_km IS NULL OR (rate_pln_per_km > 0 AND rate_pln_per_km < 100));
  END IF;
END $$;

-- users: ewidencja profile --------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS employer text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vehicle_registration text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vehicle_engine_cc integer;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_profile_check' AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_profile_check CHECK (
      (full_name IS NULL OR char_length(full_name) <= 200)
      AND (address IS NULL OR char_length(address) <= 200)
      AND (employer IS NULL OR char_length(employer) <= 200)
      AND (vehicle_registration IS NULL OR char_length(vehicle_registration) <= 12)
      AND (vehicle_engine_cc IS NULL OR (vehicle_engine_cc >= 0 AND vehicle_engine_cc <= 20000))
    );
  END IF;
END $$;

-- trip_quota: trips CREATED per user per Warsaw month -------------------------
CREATE TABLE IF NOT EXISTS trip_quota (
  clerk_user_id text NOT NULL REFERENCES users (clerk_user_id) ON DELETE CASCADE,
  month date NOT NULL,                      -- first day of the Warsaw month
  created_count integer NOT NULL DEFAULT 0 CHECK (created_count >= 0),
  PRIMARY KEY (clerk_user_id, month)
);
-- Backfill from existing rows (no-op on an empty DB).
INSERT INTO trip_quota (clerk_user_id, month, created_count)
SELECT clerk_user_id,
       date_trunc('month', created_at AT TIME ZONE 'Europe/Warsaw')::date,
       COUNT(*)
FROM trips
GROUP BY 1, 2
ON CONFLICT (clerk_user_id, month) DO UPDATE
  SET created_count = GREATEST(trip_quota.created_count, EXCLUDED.created_count);

-- rate_limits: fixed windows ---------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limits (
  key text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);
CREATE INDEX IF NOT EXISTS rate_limits_window_start_idx ON rate_limits (window_start);

-- checkout_consents: evidence of statements at /kup ---------------------------
-- No FK on purpose: evidence is kept after account deletion for the
-- limitation period of claims (see Polityka prywatności).
CREATE TABLE IF NOT EXISTS checkout_consents (
  id bigserial PRIMARY KEY,
  clerk_user_id text NOT NULL,
  billing_interval text NOT NULL CHECK (billing_interval IN ('month', 'year')),
  price_pln numeric(10, 2) NOT NULL,
  terms_version text NOT NULL,
  terms_text text NOT NULL,
  early_start_text text NOT NULL,
  business_purpose text CHECK (business_purpose IS NULL OR business_purpose IN ('non_professional', 'professional')),
  checkout_session_id text,
  created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS checkout_consents_user_idx ON checkout_consents (clerk_user_id, created_at);
CREATE INDEX IF NOT EXISTS checkout_consents_session_idx ON checkout_consents (checkout_session_id);

-- stripe_events: processing status ---------------------------------------------
ALTER TABLE stripe_events ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'processed';
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'stripe_events_status_check' AND conrelid = 'public.stripe_events'::regclass
  ) THEN
    ALTER TABLE stripe_events ADD CONSTRAINT stripe_events_status_check
      CHECK (status IN ('processing', 'processed'));
  END IF;
END $$;

INSERT INTO schema_migrations (version) VALUES ('003_audit_fixes') ON CONFLICT DO NOTHING;

COMMIT;
