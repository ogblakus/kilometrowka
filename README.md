# Kilometrówka.app

Prosta ewidencja przejazdów i kalkulator **kilometrówki** oraz **diet krajowych** (Polska, stawki 2026).

MVP: Next.js (App Router) + TypeScript + Tailwind. Goście: dane w `localStorage`. Zalogowani (Clerk): przejazdy i plan w Neon Postgres.

Live: https://kilometrowka-nine.vercel.app  
Repo: https://github.com/ogblakus/kilometrowka

## Funkcje

- **Landing** — hero, dla kogo, jak działa, FAQ, cennik Free / Premium / Dla firm
- **Kalkulator** — przejazdy, sumy miesięczne, filtr miesiąca, walidacja formularza
- **Freemium** — Free: max 10 przejazdów/mies + CSV; Premium: nielimit + Excel + diety
- **Eksport** — CSV (UTF-8 BOM, `;`) oraz Excel `.xlsx` (Premium)
- **Diety krajowe** — 45 zł/doba (Premium)
- **Płatności** — Stripe **Checkout Sessions** (`POST /api/checkout`) na `/kup`; po płatności `/kup/sukces` weryfikuje sesję i odblokowuje Premium. Zamówienie wymaga akceptacji Regulaminu i żądania natychmiastowego świadczenia (zapisywane w `checkout_consents`). Subskrypcją (rezygnacja, karta, faktury) zarządza się w Stripe Customer Portal z `/konto`.
- **Konto** — `/konto`: plan, portal Stripe, odstąpienie od umowy, dane do ewidencji przebiegu (osoba, pojazd), usunięcie konta
- **RODO** — `/polityka-prywatnosci`, `/regulamin` (treść w `src/content/*.ts`), stopka z danymi sprzedawcy

## Plany

| | Free | Premium | Dla firm |
|---|------|---------|----------|
| Cena | 0 zł | 29 zł/mies lub **279 zł/rok** (oszczędzasz 69 zł) | od 99 zł/mies (wycena indywidualna) |
| Przejazdy | max 10 / miesiąc | nielimit | indywidualnie |
| CSV | ✓ | ✓ | ✓ |
| Excel | ✗ | ✓ | ✓ |
| Diety | ✗ | ✓ | ✓ |

Plan pochodzi wyłącznie z serwera (`GET /api/me` → Neon). Po płatności: `/kup/sukces?session_id=…` → `POST /api/premium/activate` (weryfikacja sesji po stronie serwera); źródłem prawdy jest webhook Stripe. Sprzedawca jest zwolniony z VAT (art. 113) — nigdy „Faktura VAT”.

## Stawki (2026)

### Kilometrówka (rozporządzenie MI, Dz.U. 2002 nr 27 poz. 271 ze zm.; stawki od 17.01.2023 — Dz.U. 2023 poz. 5)

Tabela stawek jest wersjonowana (`RATE_TABLE` w `src/lib/rates.ts`); stawka obowiązująca w dniu przejazdu jest zapisywana przy przejeździe (`trips.rate_pln_per_km`) i używana w edycji i eksporcie.

| Pojazd | Stawka |
|--------|--------|
| Samochód osobowy ≤ 900 cm³ | 0,89 zł/km |
| Samochód osobowy > 900 cm³ | 1,15 zł/km |
| Motocykl | 0,69 zł/km |
| Motorower | 0,42 zł/km |

### Diety krajowe

- Podstawa: rozporządzenie MPiPS z 29.01.2013 (t.j. Dz.U. 2023 poz. 2190), §§ 7–9
- Dieta: **45 zł/doba** (od 1.01.2023; projekt 60 zł **nie jest prawem**)
- Podróż ≤ 24 h: < 8 h: 0 · 8–12 h: 50% · > 12 h: 100%
- Podróż > 24 h: każda pełna doba 100%; rozpoczęta doba do 8 h: 50%, ponad 8 h: 100%
- Posiłki zapewnione: śniadanie −25%, obiad −50%, kolacja −25% (dieta nie mniej niż 0 zł)
- Ryczałt za nocleg (bez rachunku): 150% diety za każdą noc z ≥ 6 h między 21:00 a 7:00
- Ryczałt na dojazdy komunikacją miejscową: 20% diety za każdą rozpoczętą dobę

## Testy

```bash
npm test   # vitest — testy graniczne kalkulatora diet (src/lib/dieta.test.ts)
```

## Zastrzeżenie

Narzędzie **pomocnicze** — nie stanowi porady podatkowej, prawnej ani księgowej.

## Start lokalny

```bash
npm install
cp .env.example .env.local   # uzupełnij Stripe (opcjonalnie)
npm run dev
```

```bash
npm run build && npm start
```

## Stripe Checkout Sessions (produkcja)

1. **Stripe Dashboard** → Products: utwórz produkt Premium z dwoma cenami cyklicznymi (29 zł/mies, 279 zł/rok) → skopiuj `price_…`.
2. **Vercel → Project → Settings → Environment Variables** (Production + Preview jeśli chcesz):

| Zmienna | Przykład | Uwagi |
|---------|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://kilometrowka-nine.vercel.app` | Origin bez trailing slash |
| `STRIPE_SECRET_KEY` | `sk_live_…` / `sk_test_…` | **Tylko serwer** — nigdy `NEXT_PUBLIC_` |
| `STRIPE_PRICE_ID_MONTHLY` | `price_…` | Cena miesięczna |
| `STRIPE_PRICE_ID_YEARLY` | `price_…` | Cena roczna |
| `STRIPE_PRODUCT_ID_PREMIUM` | `prod_…` | Produkt Premium — tylko on nadaje Premium |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` | Signing secret endpointu webhooka — **tylko serwer** |
| `DATABASE_URL` | `postgresql://…` | Neon (schemat: `database/migrations`) |
| `CLERK_WEBHOOK_SIGNING_SECRET` | `whsec_…` | Webhook Clerk → `/api/clerk/webhook` (`user.updated`, `user.deleted`) |
| `STRIPE_PORTAL_CONFIGURATION_ID` | `bpc_…` | Opcjonalnie; inaczej konfiguracja portalu jest tworzona automatycznie |

3. **Webhook**: Stripe Dashboard → Developers → Webhooks → endpoint `https://<domena>/api/stripe/webhook`, zdarzenia `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` → skopiuj `whsec_…` do `STRIPE_WEBHOOK_SECRET`.
4. **Redeploy** po dodaniu env.
5. Smoke: `/kup` → wybór mies/rok → 2 checkboxy → „Zamawiam i płacę” → Checkout → `/kup/sukces` → Premium w kalkulatorze → `/konto` → „Zarządzaj subskrypcją”.
6. Bez powyższych zmiennych `/kup` informuje, że płatności są chwilowo niedostępne.

### Webhook i uprawnienia Premium

- `POST /api/stripe/webhook` (runtime nodejs, publiczny — autoryzacja podpisem Stripe) jest **źródłem prawdy** dla `users.plan`.
- Weryfikacja podpisu (`STRIPE_WEBHOOK_SECRET`) → 400 przy złym/brakującym podpisie. Idempotencja insert-first po `event.id` w `stripe_events` (status `processing` → `processed`); płatność z naszego checkoutu, której nie da się przypisać → 500 (Stripe ponawia, alarm w logach). Błąd przetwarzania → 500 (Stripe ponowi).
- Mapowanie na użytkownika: `client_reference_id` / `metadata.clerk_user_id` (ustawiane w `/api/checkout`, także na subskrypcji) → `stripe_customer_id` → `stripe_subscription_id`.
- Premium tylko gdy produkt subskrypcji = `STRIPE_PRODUCT_ID_PREMIUM` (lub cena = jedna z cen Premium) i status `active`/`trialing`. `past_due` = plan bez zmian (Stripe ponawia płatność); `canceled`/`unpaid`/`incomplete_expired`/inne = `free`.
- Zapisywane w `users`: `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`, `current_period_end`.
- `POST /api/premium/activate` to szybka ścieżka po powrocie z Checkout — weryfikuje sesję po stronie serwera (opłacona, należy do zalogowanego użytkownika Clerk, właściwy produkt, subskrypcja aktywna). Nigdy nie ufa klientowi.

### Migracje bazy

`database/migrations/*.sql` — idempotentne, uruchamiaj po kolei w Neon (SQL Editor lub `psql "$DATABASE_URL" -f …`); `000_init.sql` = schemat bazowy, zastosowane wersje w `schema_migrations`. Szczegóły: `database/README.md`.

## Jak wypuścić (checklist)

1. Ustaw env Stripe (tabela wyżej) + Redeploy.
2. **Deployment Protection**: Standard Protection (Vercel Authentication) — preview i stare URL-e deploymentów wymagają logowania do Vercel; alias produkcyjny jest publiczny.
3. **Domena** (do kupienia): Settings → Domains + DNS, potem instancja produkcyjna Clerk.
4. Smoke: `/`, `/kalkulator`, limit Free, `/kup`, `/kup/sukces`, `/konto`, `/polityka-prywatnosci`, `/regulamin`.
5. CI (`.github/workflows/ci.yml`): lint, typecheck, testy, build, `npm audit`.

## Stack

- Next.js (App Router) · TypeScript · Tailwind CSS · ExcelJS · Stripe (server-only)

## Env vars

Zobacz `.env.example`. **Nie commituj sekretów** (`STRIPE_SECRET_KEY`, webhook secrets itd.).
