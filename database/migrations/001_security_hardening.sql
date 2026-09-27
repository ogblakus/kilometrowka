-- 001_security_hardening.sql
-- Idempotent: safe to run multiple times (IF NOT EXISTS / guarded DO blocks).
-- Adds Stripe subscription state on users, a stripe_events table for webhook
-- idempotency, and data-integrity CHECK constraints on trips that mirror
-- src/lib/trip-validate.ts.

BEGIN;

-- ---------------------------------------------------------------------------
-- users: Stripe subscription state (webhook = source of truth)
-- ---------------------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

-- One Stripe customer maps to at most one app user (NULLs allowed).
CREATE UNIQUE INDEX IF NOT EXISTS users_stripe_customer_id_key
  ON users (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_stripe_subscription_id_idx
  ON users (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_subscription_status_check'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_subscription_status_check CHECK (
      subscription_status IS NULL OR subscription_status IN (
        'incomplete', 'incomplete_expired', 'trialing', 'active',
        'past_due', 'canceled', 'unpaid', 'paused'
      )
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- stripe_events: processed webhook event ids (idempotency / dedupe)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stripe_events (
  id text PRIMARY KEY,                       -- Stripe event id (evt_...)
  type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stripe_events_processed_at_idx
  ON stripe_events (processed_at);

-- ---------------------------------------------------------------------------
-- trips: integrity constraints (mirror server-side validation)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trips_km_range_check' AND conrelid = 'public.trips'::regclass
  ) THEN
    ALTER TABLE trips ADD CONSTRAINT trips_km_range_check
      CHECK (km > 0 AND km <= 1000000);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trips_amount_pln_check' AND conrelid = 'public.trips'::regclass
  ) THEN
    ALTER TABLE trips ADD CONSTRAINT trips_amount_pln_check
      CHECK (amount_pln >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trips_vehicle_check' AND conrelid = 'public.trips'::regclass
  ) THEN
    ALTER TABLE trips ADD CONSTRAINT trips_vehicle_check CHECK (
      vehicle IN ('samochod_do_900', 'samochod_ponad_900', 'motocykl', 'motorower')
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trips_text_length_check' AND conrelid = 'public.trips'::regclass
  ) THEN
    ALTER TABLE trips ADD CONSTRAINT trips_text_length_check CHECK (
      char_length(from_place) <= 200
      AND char_length(to_place) <= 200
      AND char_length(purpose) <= 500
    );
  END IF;
END $$;

COMMIT;
