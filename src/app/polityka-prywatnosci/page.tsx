import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Polityka prywatności — Kilometrówka.app",
  description:
    "Jak Kilometrówka.app przetwarza dane: localStorage, brak konta, brak śledzenia ewidencji na serwerze.",
};

export default function PolitykaPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 prose-sm">
      <h1 className="text-3xl font-bold text-slate-900">
        Polityka prywatności
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Ostatnia aktualizacja: 21 września 2026
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">1. Administrator</h2>
          <p className="mt-2">
            Serwis Kilometrówka.app („Serwis”) jest prowadzony jako narzędzie
            pomocnicze do ewidencji przejazdów. W sprawach prywatności:{" "}
            <a
              className="underline underline-offset-2"
              href="mailto:kontakt@kilometrowka.app"
            >
              kontakt@kilometrowka.app
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            2. Jakie dane zbieramy
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Ewidencja przejazdów</strong> (daty, trasy, km, cele,
              pojazdy, kwoty) — zapisywana wyłącznie w pamięci lokalnej
              przeglądarki użytkownika (<code>localStorage</code>). Nie
              przesyłamy tych danych na nasze serwery.
            </li>
            <li>
              <strong>Plan (Free / Premium)</strong> — flaga w{" "}
              <code>localStorage</code> tej przeglądarki.
            </li>
            <li>
              <strong>Lista oczekujących / kontakt</strong> — adres e-mail
              wpisany w formularzu jest na razie zapisywany lokalnie w
              przeglądarce (nie ma backendu zbierającego maile). Gdy
              uruchomimy zewnętrzną listę lub newsletter, zaktualizujemy tę
              politykę.
            </li>
            <li>
              Hosting (Vercel) może przetwarzać standardowe logi techniczne
              (np. adres IP, User-Agent) w celu utrzymania i bezpieczeństwa
              strony — zgodnie z polityką dostawcy hostingu.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            3. Cele i podstawa
          </h2>
          <p className="mt-2">
            Dane ewidencji służą wyłącznie Tobie do prowadzenia dziennika
            przejazdów. Nie prowadzimy kont użytkowników ani centralnej bazy
            przejazdów. Płatności Premium realizuje Stripe — wtedy obowiązuje
            ich polityka prywatności oraz nasze zasady dotyczące localStorage
            planu Premium.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">4. Cookies</h2>
          <p className="mt-2">
            Serwis nie używa własnych cookies marketingowych. Możemy polegać na
            niezbędnych mechanizmach hostingu / CDN. Nie śledzimy ewidencji
            przejazdów reklamowo.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">5. Twoje prawa</h2>
          <p className="mt-2">
            Dane w <code>localStorage</code> możesz w każdej chwili usunąć
            samodzielnie (wyczyść dane witryny w ustawieniach przeglądarki). W
            razie pytań RODO napisz na adres kontaktowy powyżej.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">6. Zmiany</h2>
          <p className="mt-2">
            Zaktualizujemy tę stronę, gdy pojawią się konta, synchronizacja w
            chmurze albo zewnętrzny newsletter.
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm">
        <Link href="/" className="font-medium text-slate-900 underline-offset-4 hover:underline">
          ← Wróć na stronę główną
        </Link>
      </p>
    </article>
  );
}
