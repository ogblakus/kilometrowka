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
- **Płatności** — strona `/kup` z checkoutem Lemon/Stripe **lub** waitlistą, gdy brak URL
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
Prawdziwe odblokowanie po płatności: webhook (do zrobienia po podłączeniu Lemon/Stripe).

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
cp .env.example .env.local   # opcjonalnie
npm run dev
```

```bash
npm run build && npm start
```

## Jak wypuścić jutro (checklist)

1. **Vercel → Project → Settings → Environment Variables** (Production):
   - `NEXT_PUBLIC_SITE_URL` = `https://kilometrowka-nine.vercel.app` (lub własna domena)
   - `NEXT_PUBLIC_LEMON_CHECKOUT_URL` = URL checkoutu Lemon Squeezy **albo**
   - `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` = Stripe Payment Link
2. **Redeploy** po dodaniu env (Deployments → Redeploy).
3. **Deployment Protection**: Settings → Deployment Protection → wyłącz dla Production (albo dodaj wyjątki), żeby strona była publiczna bez logowania Vercel.
4. **Lemon Squeezy** (zalecane PL/EU):
   - Utwórz produkt Premium (miesięczny 29 zł i/lub roczny 279 zł)
   - Skopiuj Checkout URL → `NEXT_PUBLIC_LEMON_CHECKOUT_URL`
   - (Później) Webhook → ustaw `plan=premium` w localStorage / e-mail z licencją
5. **Stripe** (alternatywa): Payment Link → `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`
6. **Domena** (opcjonalnie): Settings → Domains → dodaj `kilometrowka.app` + DNS
7. Smoke test: `/`, `/kalkulator`, limit Free, `/kup` (Zapłać otwiera checkout), `/polityka-prywatnosci`, `/regulamin`
8. Test Premium lokalnie: `/kalkulator?premium=1`

Bez ustawionego checkout URL przycisk na `/kup` pokazuje **„Wkrótce — zapisz się”** (waitlista w localStorage) — nie udaje żywych płatności.

## Stack

- Next.js (App Router) · TypeScript · Tailwind CSS · ExcelJS

## Env vars

Zobacz `.env.example`. **Nie commituj sekretów** (webhook secretów itd.) — na razie wystarczą publiczne URL checkoutu.
