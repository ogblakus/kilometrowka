-- 002_trip_quota_created_at.sql
-- Idempotent. Free quota now counts trips by created_at (server-set) in the
-- current Europe/Warsaw calendar month instead of the user-editable trip_date.
-- Enforcement is atomic in the app (advisory lock + INSERT … SELECT … WHERE
-- inside one transaction, see src/lib/trips-db.ts createTripWithQuota).

BEGIN;

-- created_at: server-set creation timestamp (already present on prod; guard anyway)
ALTER TABLE trips ADD COLUMN IF NOT EXISTS created_at timestamptz;
UPDATE trips SET created_at = NOW() WHERE created_at IS NULL;
ALTER TABLE trips ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE trips ALTER COLUMN created_at SET NOT NULL;

-- Quota lookups: WHERE clerk_user_id = $1 AND created_at >= month_start
CREATE INDEX IF NOT EXISTS trips_user_created_at_idx
  ON trips (clerk_user_id, created_at);

-- Backstop date range (app enforces the tighter 2000-01-01 .. today+1y).
-- NOT VALID first so the constraint can be added without failing on legacy
-- rows; then validate (table is small / empty).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trips_trip_date_range_check'
      AND conrelid = 'public.trips'::regclass
  ) THEN
    ALTER TABLE trips ADD CONSTRAINT trips_trip_date_range_check
      CHECK (trip_date >= DATE '2000-01-01' AND trip_date <= DATE '2100-12-31')
      NOT VALID;
    ALTER TABLE trips VALIDATE CONSTRAINT trips_trip_date_range_check;
  END IF;
END $$;

COMMIT;
