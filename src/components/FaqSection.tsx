import { FREE_TRIPS_PER_MONTH } from "@/lib/plan";

const faq = [
  {
    q: "Czy to rada podatkowa?",
    a: "Nie. Kilometrówka.app to narzędzie pomocnicze do ewidencji i szacowania kwot według opublikowanych stawek. Nie stanowi porady podatkowej, prawnej ani księgowej — w razie wątpliwości skonsultuj księgowego lub doradcę.",
  },
  {
    q: "Gdzie są moje dane?",
    a: "Ewidencja przejazdów i status planu zapisują się w localStorage Twojej przeglądarki. Nie prowadzimy konta ani centralnej bazy przejazdów. Czyszczenie przeglądarki lub inna przeglądarka = brak tych danych — warto eksportować CSV/Excel.",
  },
  {
    q: "Czym różni się Free od Premium?",
    a: `Free: do ${FREE_TRIPS_PER_MONTH} przejazdów na miesiąc i eksport CSV. Premium: nielimitowane przejazdy, Excel (.xlsx), kalkulator diet krajowych, bez reklam. Dane nadal lokalnie.`,
  },
  {
    q: "Jak działa płatność?",
    a: "Kupujesz Premium przez Stripe Checkout (karta). Po opłaceniu wracasz na stronę sukcesu — plan Premium zapisuje się w tej przeglądarce. Szczegóły: regulamin i polityka prywatności.",
  },
  {
    q: "Co po zakupie?",
    a: "Od razu odblokujesz Excel, diety i nielimitowaną ewidencję w tej przeglądarce. Subskrypcja miesięczna lub roczna jest obsługiwana przez Stripe; Premium lokalne nie synchronizuje się między urządzeniami.",
  },
];

export default function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-slate-200 py-14 sm:py-16">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-2xl font-bold text-slate-900">Najczęstsze pytania</h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Krótko i na temat — zanim kupisz lub zaczniesz ewidencję.
        </p>
        <dl className="mt-8 space-y-3">
          {faq.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-slate-200 bg-white open:shadow-sm"
            >
              <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-slate-900 marker:content-none [&::-webkit-details-marker]:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-inset rounded-xl">
                <span className="flex items-center justify-between gap-3">
                  {item.q}
                  <span
                    className="shrink-0 text-slate-400 transition group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </span>
              </summary>
              <dd className="border-t border-slate-100 px-5 pb-4 pt-3 text-sm leading-relaxed text-slate-600">
                {item.a}
              </dd>
            </details>
          ))}
        </dl>
      </div>
    </section>
  );
}
