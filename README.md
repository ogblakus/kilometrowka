# Kilometrówka.app

Prosta ewidencja przejazdów i kalkulator **kilometrówki** oraz **diet krajowych** (Polska, stawki 2026).

MVP: Next.js (App Router) + TypeScript + Tailwind. Dane zapisujesz lokalnie w przeglądarce (`localStorage`) — bez konta, bez Stripe, bez backendu.

## Funkcje

- **Landing** — hero, dla kogo, jak działa, cennik (teaser 99–149 zł/rok), lista oczekujących (e-mail → localStorage)
- **Kalkulator / ewidencja** — przejazdy (data, skąd, dokąd, km, cel, pojazd), automatyczna kwota, edycja/usuwanie, sumy miesięczne
- **Eksport** — CSV (UTF-8 BOM, separator `;`) oraz Excel `.xlsx` (ExcelJS)
- **Diety krajowe** — 45 zł/doba, progi <8 h / 8–12 h / >12 h, opcjonalny ryczałt noclegowy i dojazdów
- **UI po polsku** — kwoty w zł z przecinkiem, daty Europe/Warsaw, układ mobilny

## Stawki (2026)

### Kilometrówka (Dz.U. 2023 poz. 5)

| Pojazd | Stawka |
|--------|--------|
| Samochód osobowy ≤ 900 cm³ | 0,89 zł/km |
| Samochód osobowy > 900 cm³ | 1,15 zł/km |
| Motocykl | 0,69 zł/km |
| Motorower | 0,42 zł/km |

### Diety krajowe (MRPiPS — nadal 45 zł)

- Dieta: **45 zł/doba** (projekt 60 zł **nie jest prawem**)
- < 8 h: 0 · 8–12 h: 50% · > 12 h: 100% · wielodniowe wg §7
- Opcjonalnie: ryczałt nocleg **67,50 zł**, dojazdy **9 zł**

## Zastrzeżenie

Narzędzie **pomocnicze** — nie stanowi porady podatkowej, prawnej ani księgowej. Oficjalne stawki kilometrówki dotyczą głównie zwrotu kosztów pracownikowi za używanie prywatnego pojazdu. Zasady podatkowe JDG mogą się różnić.

## Start lokalny

```bash
npm install
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # produkcja
npm start
```

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- ExcelJS (eksport `.xlsx`)

## Repozytorium

https://github.com/ogblakus/kilometrowka
