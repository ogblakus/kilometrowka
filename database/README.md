# Baza danych (Neon Postgres)

Migracje w `migrations/` są **idempotentne** (`IF NOT EXISTS`, bloki `DO $$`), numerowane i
uruchamiane ręcznie, w kolejności, **przed** wdrożeniem kodu, który ich wymaga:

```bash
for f in database/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done
```

Zastosowane wersje są zapisywane w tabeli `schema_migrations`.

- `000_init.sql` – schemat bazowy (`users`, `trips`), odtworzony z produkcji.
- `001_security_hardening.sql` – stan subskrypcji Stripe, `stripe_events`, CHECK-i.
- `002_trip_quota_created_at.sql` – limit Free liczony po `created_at`.
- `003_audit_fixes.sql` – snapshot stawki, profil ewidencji, `trip_quota`, `rate_limits`,
  `checkout_consents`, status `stripe_events`.

Każda migracja jest addytywna, żeby poprzednia wersja aplikacji działała do czasu wdrożenia nowej.
Preview **nie powinien** używać produkcyjnego `DATABASE_URL` (użyj brancha Neon).
