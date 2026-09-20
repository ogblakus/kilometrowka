import { KILOMETROWKA_YEAR, RATE_SOURCES } from "@/lib/rates";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="font-semibold text-slate-900">
              Kilometrówka.app
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Prosta ewidencja przejazdów i kalkulator kilometrówki oraz diet
              krajowych na {KILOMETROWKA_YEAR} r. Dane zapisujesz lokalnie w
              przeglądarce — bez konta i bez chmury.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">Źródła stawek</p>
            <ul className="mt-2 space-y-2 text-xs leading-relaxed text-slate-500">
              {RATE_SOURCES.map((s) => (
                <li key={s.title}>
                  <span className="font-medium text-slate-700">{s.title}:</span>{" "}
                  {s.detail}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-8 border-t border-slate-200 pt-6 text-xs text-slate-500">
          © {KILOMETROWKA_YEAR} Kilometrówka.app · Narzędzie pomocnicze — nie
          stanowi porady podatkowej ani księgowej.
        </p>
      </div>
    </footer>
  );
}
