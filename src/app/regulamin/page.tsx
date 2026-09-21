import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Regulamin — Kilometrówka.app",
  description:
    "Regulamin korzystania z Kilometrówka.app: narzędzie pomocnicze, brak porady podatkowej, localStorage.",
};

export default function RegulaminPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Regulamin</h1>
      <p className="mt-2 text-sm text-slate-500">
        Ostatnia aktualizacja: 21 września 2026
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">1. Postanowienia ogólne</h2>
          <p className="mt-2">
            Kilometrówka.app („Serwis”) umożliwia prowadzenie prostej ewidencji
            przejazdów oraz szacowanie kilometrówki i diet krajowych według
            opublikowanych stawek. Korzystając z Serwisu, akceptujesz niniejszy
            regulamin.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            2. Charakter narzędzia
          </h2>
          <p className="mt-2">
            Serwis ma charakter <strong>pomocniczy i informacyjny</strong>.{" "}
            <strong>
              Nie stanowi porady podatkowej, prawnej ani księgowej.
            </strong>{" "}
            Oficjalne stawki kilometrówki służą przede wszystkim do zwrotu
            kosztów pracownikowi za używanie prywatnego pojazdu. Zasady
            podatkowe JDG mogą się różnić. Za decyzje rozliczeniowe odpowiada
            użytkownik — w razie wątpliwości skonsultuj księgowego lub doradcę
            podatkowego.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">3. Dane i konto</h2>
          <p className="mt-2">
            MVP nie wymaga rejestracji. Ewidencja jest przechowywana w
            przeglądarce użytkownika (<code>localStorage</code>). Utrata danych
            lokalnych (czyszczenie przeglądarki, inna przeglądarka / urządzenie)
            nie jest objęta odpowiedzialnością operatora Serwisu — eksportuj
            kopie (CSV / Excel) we własnym zakresie.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">4. Plany i płatności</h2>
          <p className="mt-2">
            Plan Free ma limity (m.in. liczba przejazdów w miesiącu, brak
            eksportu Excel i diet). Plan Premium odblokowuje dodatkowe funkcje.
            Płatności Premium realizuje Stripe Checkout (subskrypcja miesięczna
            lub roczna). Po opłaceniu Premium zapisuje się lokalnie w przeglądarce
            użytkownika (localStorage). Oferta „Dla firm” jest ustalana
            indywidualnie.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">5. Odpowiedzialność</h2>
          <p className="mt-2">
            Staramy się utrzymywać aktualne stawki i poprawne wyliczenia, ale nie
            gwarantujemy kompletności ani zgodności z indywidualną sytuacją
            podatkową. Serwis jest dostarczany „tak jak jest” w zakresie dozwolonym
            prawem.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">6. Kontakt</h2>
          <p className="mt-2">
            <a
              className="underline underline-offset-2"
              href="mailto:kontakt@kilometrowka.app"
            >
              kontakt@kilometrowka.app
            </a>
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm">
        <Link
          href="/"
          className="font-medium text-slate-900 underline-offset-4 hover:underline"
        >
          ← Wróć na stronę główną
        </Link>
      </p>
    </article>
  );
}
