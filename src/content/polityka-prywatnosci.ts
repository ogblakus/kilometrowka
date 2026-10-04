// Source text: legal review 2026-10-04 (wersja 1.0). Edit here; rendered by src/components/LegalMarkdown.tsx.
export const POLITYKA_PRYWATNOSCI_MD = `
# Polityka prywatności serwisu Kilometrówka.app

Obowiązuje od: **04.10.2026**

Niniejsza polityka wykonuje obowiązek informacyjny z art. 13 rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 (**RODO**) wobec osób korzystających z serwisu Kilometrówka.app (**„Serwis”**), dostępnego pod adresem https://kilometrowka-nine.vercel.app.

## 1. Administrator danych

Administratorem Twoich danych osobowych jest **Paweł Michalak**, prowadzący działalność gospodarczą pod firmą **Paweł Michalak Usługi**, NIP 7773431444, os. Zygmunta III Wazy 2/46, 62-020 Swarzędz (**„Administrator”**).

Kontakt we wszystkich sprawach dotyczących danych osobowych: **djpablo312@icloud.com** lub pisemnie na adres powyżej. Administrator nie wyznaczył inspektora ochrony danych.

## 2. Tryb Gościa a Konto — gdzie są Twoje dane

1. **Tryb Gościa (bez logowania).** Ewidencja przejazdów oraz dane do ewidencji przebiegu (osoba, pojazd) zapisywane są **wyłącznie w pamięci lokalnej Twojej przeglądarki (localStorage)** na Twoim urządzeniu. Nie są przesyłane do Administratora, a Administrator nie ma do nich dostępu. Możesz je w każdej chwili usunąć, czyszcząc dane witryny w przeglądarce.
2. **Konto (po zalogowaniu).** Aby korzystać z Serwisu na wielu urządzeniach i kupić Plan Premium, zakładasz Konto. Wtedy dane Konta, ewidencja przejazdów i informacje o planie są **przechowywane na serwerach** dostawców Administratora (pkt 5).

## 3. Jakie dane przetwarzamy

| Kategoria | Zakres | Źródło |
|---|---|---|
| Dane Konta | adres e-mail, identyfikator użytkownika, imię i nazwisko (opcjonalnie), dane uwierzytelniania (hasło w formie zabezpieczonej, kody jednorazowe wysyłane e-mailem), a przy logowaniu przez Google lub Apple — dane przekazane przez tego dostawcę (adres e-mail — w przypadku Apple może to być adres przekierowujący — imię i nazwisko, a w przypadku Google także zdjęcie profilowe), data utworzenia i ostatniego logowania | od Ciebie / dostawca logowania (Google, Apple) |
| Dane ewidencji | data przejazdu, miejsce początkowe i docelowe, liczba km, cel przejazdu, rodzaj pojazdu, stawka i obliczona kwota; dane do nagłówka ewidencji przebiegu pojazdu (opcjonalnie): imię i nazwisko, adres, pracodawca, numer rejestracyjny i pojemność silnika | od Ciebie |
| Dowód oświadczeń przy zakupie | identyfikator Konta, wybrany okres i cena, wersja i treść zaakceptowanych oświadczeń (Regulamin, żądanie natychmiastowego rozpoczęcia świadczenia), deklaracja celu zakupu, identyfikator sesji płatności, data i godzina | od Ciebie |
| Dane subskrypcji i płatności | plan (Free/Premium), identyfikatory klienta i subskrypcji w Stripe, status subskrypcji, data końca okresu rozliczeniowego; w Stripe dodatkowo: imię i nazwisko/nazwa, e-mail, kraj, adres rozliczeniowy (jeśli wymagany), dane metody płatności (Administrator nie widzi pełnego numeru karty), historia transakcji | od Ciebie / Stripe |
| Dane techniczne | adres IP, typ urządzenia i przeglądarki, dane sesji logowania, logi serwera (czas i adres żądania, kody błędów) | automatycznie |
| Korespondencja | adres e-mail i treść wiadomości (np. reklamacje, rezygnacja, odstąpienie, żądania RODO) | od Ciebie |

Pola „cel przejazdu” i „trasa” to pola swobodne — **nie wpisuj w nich danych szczególnych kategorii ani zbędnych danych osób trzecich.**

Podanie danych jest dobrowolne, ale niezbędne do założenia Konta (e-mail) i zawarcia umowy Premium (dane płatności). Bez Konta możesz korzystać z Serwisu w trybie Gościa.

## 4. Cele i podstawy prawne przetwarzania

| Cel | Podstawa prawna (RODO) | Okres przechowywania |
|---|---|---|
| Założenie i prowadzenie Konta, przechowywanie i synchronizacja ewidencji, świadczenie Planu Free i Premium | art. 6 ust. 1 lit. b — wykonanie umowy | do usunięcia Konta; kopie (historia zmian bazy danych w Neon) — do 6 godzin od usunięcia (historia przywracania bazy; nie wykonujemy dodatkowych kopii zapasowych ani snapshotów) |
| Obsługa płatności, subskrypcji, zwrotów | art. 6 ust. 1 lit. b | przez czas trwania umowy, następnie jak niżej |
| Wystawianie faktur, prowadzenie ewidencji sprzedaży i dokumentacji podatkowej | art. 6 ust. 1 lit. c — obowiązek prawny (przepisy podatkowe i o rachunkowości) | 5 lat od końca roku kalendarzowego, w którym upłynął termin płatności podatku, z zastrzeżeniem przypadków zawieszenia lub przerwania biegu terminu przedawnienia zobowiązania podatkowego |
| Obsługa reklamacji, odstąpienia od umowy, rezygnacji | art. 6 ust. 1 lit. b i c (obowiązki z ustawy o prawach konsumenta) | do czasu zakończenia sprawy, a następnie do upływu terminu przedawnienia roszczeń |
| Ustalenie, dochodzenie i obrona roszczeń; dowód złożenia oświadczeń przy zakupie (akceptacja Regulaminu, żądanie natychmiastowego rozpoczęcia świadczenia) | art. 6 ust. 1 lit. f — prawnie uzasadniony interes Administratora | do upływu terminu przedawnienia roszczeń (co do zasady 6 lat, dla roszczeń okresowych i związanych z działalnością gospodarczą — 3 lata, z końcem roku kalendarzowego) |
| Zapewnienie bezpieczeństwa Serwisu, zapobieganie nadużyciom, diagnostyka błędów (logi) | art. 6 ust. 1 lit. f | logi hostingu (Vercel): do 1 godziny (przy planie Pro — do 1 dnia); logi uwierzytelniania u Clerk: zgodnie z zasadami Clerk |
| Odpowiedź na korespondencję niezwiązaną z umową | art. 6 ust. 1 lit. f | do zakończenia korespondencji, maks. 12 miesięcy |
| Informowanie o zmianach Regulaminu i istotnych zmianach Usługi | art. 6 ust. 1 lit. b i c | przez czas posiadania Konta |

Administrator **nie wysyła marketingu** i **nie wykorzystuje danych ewidencji do celów reklamowych**.

## 5. Odbiorcy danych (podmioty przetwarzające)

Dane przekazujemy wyłącznie dostawcom niezbędnym do działania Serwisu, na podstawie umów powierzenia przetwarzania (art. 28 RODO) zawartych w ramach ich warunków świadczenia usług:

1. **Clerk, Inc.** (USA) — rejestracja, logowanie i zarządzanie sesjami (dane Konta, dane techniczne). Dane przetwarzane w USA.
2. **Neon, LLC** (USA; spółka z grupy Databricks) — baza danych PostgreSQL przechowująca dane Konta, ewidencję i status subskrypcji. Dane przechowywane w regionie **AWS eu-central-1 (Frankfurt, Niemcy)**; dostęp z USA możliwy np. w ramach wsparcia technicznego.
3. **Vercel Inc.** (USA) — hosting Serwisu i wykonywanie funkcji serwerowych. Funkcje serwerowe działają w regionie **fra1 (Frankfurt, Niemcy)**; Vercel przetwarza także logi techniczne, a dostęp z USA jest możliwy np. w ramach wsparcia technicznego.
4. **Stripe Payments Europe, Limited** (Irlandia) — obsługa płatności i subskrypcji. W zakresie niektórych celów (m.in. świadczenie regulowanych usług płatniczych, zapobieganie oszustwom, obowiązki regulacyjne) spółki Stripe Technology Europe, Limited oraz Stripe Technology Company, Limited (Irlandia) działają jako **odrębni administratorzy** danych — szczegóły: https://stripe.com/pl/privacy. W ramach grupy Stripe dane mogą być przekazywane do Stripe, LLC (USA).
5. W razie potrzeby: dostawca poczty e-mail Administratora (**Apple — iCloud Mail**) w zakresie korespondencji, a także organy publiczne, gdy obowiązek udostępnienia wynika z przepisów.

## 6. Przekazywanie danych poza Europejski Obszar Gospodarczy

Ze względu na siedzibę lub infrastrukturę dostawców (Clerk, Vercel, Neon, Stripe) dane mogą być przekazywane do **Stanów Zjednoczonych**. Przekazanie odbywa się na podstawie:

1. **decyzji wykonawczej Komisji (UE) 2023/1795 z 10 lipca 2023 r.** stwierdzającej odpowiedni stopień ochrony (EU-US Data Privacy Framework) — Clerk, Inc., Vercel Inc., Neon, LLC (w ramach certyfikacji Databricks, Inc.) i Stripe, LLC figurują w wykazie DPF (https://www.dataprivacyframework.gov) ze statusem aktywnym (stan na 1.10.2026), oraz pomocniczo
2. **standardowych klauzul umownych** przyjętych przez Komisję Europejską (decyzja wykonawcza (UE) 2021/914), włączonych do umów powierzenia dostawców, wraz z dodatkowymi środkami (m.in. szyfrowanie transmisji TLS i danych w spoczynku).

Kopię stosowanych zabezpieczeń możesz uzyskać, pisząc na adres z pkt 1.

## 7. Twoje prawa

Masz prawo do:

1. **dostępu** do danych i otrzymania ich kopii (art. 15 RODO);
2. **sprostowania** danych (art. 16) — dane ewidencji możesz też samodzielnie edytować w Serwisie;
3. **usunięcia** danych (art. 17) — m.in. przez usunięcie Konta (zob. Regulamin § 5);
4. **ograniczenia przetwarzania** (art. 18);
5. **przenoszenia danych** (art. 20) — w szczególności przez eksport ewidencji do CSV/Excel;
6. **sprzeciwu** wobec przetwarzania opartego na prawnie uzasadnionym interesie (art. 21);
7. **wniesienia skargi do organu nadzorczego** — Prezesa Urzędu Ochrony Danych Osobowych, ul. Stanisława Moniuszki 1A, 00-014 Warszawa, https://uodo.gov.pl.

Aby skorzystać z praw, napisz na **djpablo312@icloud.com**. Odpowiemy bez zbędnej zwłoki, nie później niż w ciągu miesiąca. Możemy poprosić o potwierdzenie tożsamości (np. wiadomość z adresu e-mail Konta).

Prawa te nie dotyczą danych trybu Gościa, które znajdują się wyłącznie na Twoim urządzeniu — nimi zarządzasz samodzielnie.

## 8. Zautomatyzowane decyzje i profilowanie

Administrator **nie podejmuje decyzji opartych wyłącznie na zautomatyzowanym przetwarzaniu, w tym profilowania**, w rozumieniu art. 22 RODO. Obliczenia kwot w Serwisie są wykonywane na Twoje żądanie i nie wywołują wobec Ciebie skutków prawnych. (Stripe może stosować zautomatyzowane mechanizmy zapobiegania oszustwom płatniczym jako odrębny administrator.)

## 9. Pliki cookies i pamięć lokalna (localStorage)

1. Serwis wykorzystuje **wyłącznie niezbędne** pliki cookies i pamięć lokalną, konieczne do świadczenia usługi, o którą prosisz (art. 399 ust. 3 pkt 2 ustawy z dnia 12 lipca 2024 r. — Prawo komunikacji elektronicznej). Nie wymagają one zgody.
2. **Serwis nie używa narzędzi analitycznych, reklamowych ani śledzących** (np. Google Analytics, Vercel Analytics, piksele reklamowe). Jeżeli w przyszłości wprowadzimy takie narzędzia, poprosimy o Twoją zgodę przed ich użyciem (art. 399 ust. 1 ustawy — Prawo komunikacji elektronicznej).
3. Stosowane mechanizmy:

| Nazwa | Rodzaj | Dostawca | Cel | Czas |
|---|---|---|---|---|
| __session, __client_uat, __clerk_* i pokrewne (w instancji testowej Clerk także __clerk_db_jwt) | cookie | Clerk | utrzymanie sesji logowania, bezpieczeństwo | sesja: krótkotrwały token (ok. 1 minuty, odnawiany); pozostałe — zwykle do kilku miesięcy, zgodnie z ustawieniami Clerk |
| __client (domena usługi logowania Clerk) | cookie | Clerk | uwierzytelnianie | do wylogowania lub wygaśnięcia sesji (zgodnie z ustawieniami Clerk) |
| __cf_bm, _cfuvid | cookie | Cloudflare (na zlecenie Clerk) | ochrona przed botami i nadużyciami | do 30 min / sesja |
| __clerk_environment | localStorage | Clerk | konfiguracja logowania | do usunięcia przez Ciebie |
| kilometrowka.app.trips.v1 | localStorage | Serwis | ewidencja przejazdów w trybie Gościa | do usunięcia przez Ciebie |
| kilometrowka.app.profile.v1 | localStorage | Serwis | dane do nagłówka ewidencji (osoba, pojazd) w trybie Gościa | do usunięcia przez Ciebie |
| kilometrowka.app.import.offered.v1 | localStorage | Serwis | zapamiętanie, że zaproponowano import lokalnych przejazdów na Konto | do usunięcia |
| cookies Stripe (na stronie checkout.stripe.com) | cookie | Stripe | realizacja płatności, zapobieganie oszustwom | wg Stripe |

4. Możesz zarządzać cookies i danymi witryny w ustawieniach przeglądarki. Zablokowanie niezbędnych cookies uniemożliwi logowanie; wyczyszczenie localStorage usunie dane trybu Gościa.

## 10. Bezpieczeństwo

Stosujemy szyfrowane połączenie (HTTPS/TLS), uwierzytelnianie przez wyspecjalizowanego dostawcę, kontrolę dostępu do danych wyłącznie dla zalogowanego właściciela Konta oraz ograniczony dostęp administracyjny.

## 11. Zmiany polityki

O istotnych zmianach niniejszej polityki poinformujemy w Serwisie, a posiadaczy Kont — także e-mailem. Aktualna wersja jest zawsze dostępna pod adresem https://kilometrowka-nine.vercel.app/polityka-prywatnosci.

`;
