# Kilometrówka.app

Prosta ewidencja przejazdów i kalkulator **kilometrówki** oraz **diet krajowych** (Polska, stawki 2026).

MVP: Next.js (App Router) + TypeScript + Tailwind. Dane w `localStorage` — bez konta i bez bazy.

Live: https://kilometrowka-nine.vercel.app  
Repo: https://github.com/ogblakus/kilometrowka

## Funkcje

- **Landing** — hero, dla kogo, jak działa, cennik Free / Premium / Dla firm
- **Kalkulator** — przejazdy, sumy miesięczne, filtr miesiąca, walidacja formularza
- **Freemium** — Free: max 10 przejazdów/mies + CSV; Premium: nielimit + Excel + diety
- **Eksport** — CSV (UTF-8 BOM, `;`) oraz Excel `.xlsx` (Premium)
- **Diety krajowe** — 45 zł/doba (Premium)
- **Płatności** — Stripe **Checkout Sessions** (`POST /api/checkout`) na `/kup`; po płatności `/kup/sukces` weryfikuje sesję i odblokowuje Premium. Bez konfiguracji Stripe → waitlista (bez udawania płatności).
- **RODO** — `/polityka-prywatnosci`, `/regulamin`, stopka z disclaimerem

## Plany

| | Free | Premium | Dla firm |
|---|------|---------|----------|
| Cena | 0 zł | 29 zł/mies lub **279 zł/rok** (−20%) | 99 zł/mies (kontakt) |
| Przejazdy | max 10 / miesiąc | nielimit | indywidualnie |
| CSV | ✓ | ✓ | ✓ |
| Excel | ✗ | ✓ | ✓ |
| Diety | ✗ | ✓ | ✓ |

Lokalny override testowy: `/kalkulator?premium=1` (lub `?premium=0` = Free).  
Po prawdziwej płatności Stripe: redirect na `/kup/sukces?session_id=…` → weryfikacja API → `plan=premium` w localStorage.

## Stawki (2026)

### Kilometrówka (Dz.U. 2023 poz. 5)

| Pojazd | Stawka |
|--------|--------|
| Samochód osobowy ≤ 900 cm³ | 0,89 zł/km |
| Samochód osobowy > 900 cm³ | 1,15 zł/km |
| Motocykl | 0,69 zł/km |
| Motorower | 0,42 zł/km |

### Diety krajowe

- Dieta: **45 zł/doba** (projekt 60 zł **nie jest prawem**)
- < 8 h: 0 · 8–12 h: 50% · > 12 h: 100%

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

3. **Redeploy** po dodaniu env.
4. Smoke: `/kup` → wybór mies/rok → „Zapłać przez Stripe” → Checkout → `/kup/sukces` → Premium w kalkulatorze.
5. Bez powyższych zmiennych przycisk pokazuje **waitlistę** — nie udaje żywych płatności.

Opcjonalnie (legacy): `NEXT_PUBLIC_LEMON_CHECKOUT_URL` lub `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` — używane tylko gdy Sessions nie są skonfigurowane.

## Jak wypuścić (checklist)

1. Ustaw env Stripe (tabela wyżej) + Redeploy.
2. **Deployment Protection**: Settings → Deployment Protection → wyłącz dla Production (albo wyjątki), żeby strona była publiczna.
3. **Domena** (opcjonalnie): Settings → Domains → `kilometrowka.app` + DNS.
4. Smoke: `/`, `/kalkulator`, limit Free, `/kup`, `/kup/sukces`, `/polityka-prywatnosci`, `/regulamin`.
5. Test Premium bez Stripe: `/kalkulator?premium=1`.

## Stack

- Next.js (App Router) · TypeScript · Tailwind CSS · ExcelJS · Stripe (server-only)

## Env vars

Zobacz `.env.example`. **Nie commituj sekretów** (`STRIPE_SECRET_KEY`, webhook secrets itd.).
