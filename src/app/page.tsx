import Link from "next/link";
import Disclaimer from "@/components/Disclaimer";
import WaitlistForm from "@/components/WaitlistForm";
import {
  KILOMETROWKA_YEAR,
  VEHICLE_RATES,
  DIETA_DOBOWA,
  DIETA_NOCLEG_RYCZALT,
  DIETA_DOJAZDY_RYCZALT,
} from "@/lib/rates";

const steps = [
  {
    n: "1",
    title: "Dodaj przejazd",
    text: "Data, trasa, kilometry, cel i pojazd — kwota liczy się sama.",
  },
  {
    n: "2",
    title: "Pilnuj ewidencji",
    text: "Edytuj, usuwaj, przeglądaj sumy miesięczne. Wszystko lokalnie.",
  },
  {
    n: "3",
    title: "Eksportuj",
    text: "Pobierz CSV lub Excel (.xlsx) do księgowości albo rozliczenia.",
  },
];

const audiences = [
  {
    title: "Pracownicy",
    text: "Zwrot kosztów za używanie prywatnego auta / motocykla do celów służbowych według oficjalnych stawek.",
  },
  {
    title: "Pracodawcy HR / administracja",
    text: "Szybka ewidencja przejazdów pracowników bez ciężkiego systemu ERP.",
  },
  {
    title: "JDG i freelancersi",
    text: "Pomocnicza ewidencja kilometrów — pamiętaj, że reguły podatkowe JDG mogą się różnić od stawek pracowniczych.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
          <p className="text-sm font-medium text-slate-500">
            Stawki {KILOMETROWKA_YEAR} · Dz.U. 2023 poz. 5
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Ewidencja kilometrówki bez Excela i bez konta
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Kilometrówka.app to prosty kalkulator i dziennik przejazdów po
            polsku: stawki za km, diety krajowe, eksport CSV i Excel. Dane
            zostają w Twojej przeglądarce.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/kalkulator"
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              Otwórz kalkulator
            </Link>
            <a
              href="#cennik"
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Zobacz cennik
            </a>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              Object.keys(VEHICLE_RATES) as (keyof typeof VEHICLE_RATES)[]
            ).map((k) => (
              <div
                key={k}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs text-slate-500">
                  {VEHICLE_RATES[k].short}
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {VEHICLE_RATES[k].rate.toFixed(2).replace(".", ",")}{" "}
                  <span className="text-sm font-normal text-slate-500">
                    zł/km
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="dla-kogo" className="scroll-mt-20 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-slate-900">Dla kogo</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Narzędzie dla osób, które rozliczają przejazdy prywatnym pojazdem
            albo chcą mieć porządek w kilometrach.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {audiences.map((a) => (
              <div
                key={a.title}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="font-semibold text-slate-900">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {a.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="jak-dziala" className="border-y border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-slate-900">Jak to działa</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {steps.map((s) => (
              <li
                key={s.n}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {s.n}
                </span>
                <h3 className="mt-3 font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <Link
              href="/kalkulator"
              className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline"
            >
              Przejdź do ewidencji →
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-slate-900">
              Diety krajowe (opcjonalnie)
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Obowiązująca dieta krajowa:{" "}
              <strong>{DIETA_DOBOWA} zł/doba</strong>. Poniżej 8 h — 0%; 8–12
              h — 50%; powyżej 12 h — 100%; wielodniowe według §7. Opcjonalny
              ryczałt noclegowy{" "}
              {DIETA_NOCLEG_RYCZALT.toFixed(2).replace(".", ",")} zł oraz
              dojazdy {DIETA_DOJAZDY_RYCZALT.toFixed(2).replace(".", ",")} zł.
              Projekt podwyższenia diety do 60 zł <em>nie jest prawem</em>.
            </p>
            <Link
              href="/kalkulator"
              className="mt-4 inline-block text-sm font-medium text-slate-900 underline-offset-4 hover:underline"
            >
              Oblicz dietę w kalkulatorze →
            </Link>
          </div>
        </div>
      </section>

      <section id="cennik" className="scroll-mt-20 border-t border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-slate-900">Cennik (zapowiedź)</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            MVP jest darmowe i działa lokalnie. Planujemy prosty abonament
            roczny z synchronizacją i PDF — zostaw e-mail na liście oczekujących.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">MVP teraz</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">0 zł</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>✓ Ewidencja przejazdów (localStorage)</li>
                <li>✓ Stawki kilometrówki {KILOMETROWKA_YEAR}</li>
                <li>✓ Eksport CSV i Excel</li>
                <li>✓ Kalkulator diety krajowej</li>
              </ul>
              <Link
                href="/kalkulator"
                className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Korzystaj za darmo
              </Link>
            </div>
            <div className="rounded-xl border-2 border-slate-900 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Plan roczny</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                99–149{" "}
                <span className="text-base font-normal text-slate-500">
                  zł/rok
                </span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>• Synchronizacja między urządzeniami</li>
                <li>• Eksport PDF ewidencji</li>
                <li>• Archiwum lat podatkowych</li>
                <li>• Priorytetowe wsparcie</li>
              </ul>
              <div className="mt-6">
                <p className="mb-2 text-xs text-slate-500">
                  Lista oczekujących (zapis lokalny):
                </p>
                <WaitlistForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4">
          <Disclaimer />
        </div>
      </section>
    </>
  );
}
