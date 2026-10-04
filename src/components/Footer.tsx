import Link from "next/link";
import { OPERATOR, OPERATOR_ADDRESS } from "@/lib/legal";
import { KILOMETROWKA_YEAR, RATE_SOURCES } from "@/lib/rates";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-semibold text-slate-900">Kilometrówka.app</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Prosta ewidencja przejazdów i kalkulator kilometrówki oraz diet
              krajowych na {KILOMETROWKA_YEAR} r. Tryb Gościa: dane tylko w
              Twojej przeglądarce. Z Kontem: dane przechowywane na serwerach
              naszych dostawców (szczegóły w Polityce prywatności).
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">Nawigacja</p>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
              <li>
                <Link
                  href="/kalkulator"
                  className="hover:text-slate-900 focus:outline-none focus-visible:underline"
                >
                  Kalkulator
                </Link>
              </li>
              <li>
                <Link
                  href="/#cennik"
                  className="hover:text-slate-900 focus:outline-none focus-visible:underline"
                >
                  Cennik
                </Link>
              </li>
              <li>
                <Link
                  href="/#faq"
                  className="hover:text-slate-900 focus:outline-none focus-visible:underline"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/kup"
                  className="hover:text-slate-900 focus:outline-none focus-visible:underline"
                >
                  Kup Premium
                </Link>
              </li>
              <li>
                <Link
                  href="/polityka-prywatnosci"
                  className="hover:text-slate-900 focus:outline-none focus-visible:underline"
                >
                  Polityka prywatności
                </Link>
              </li>
              <li>
                <Link
                  href="/regulamin"
                  className="hover:text-slate-900 focus:outline-none focus-visible:underline"
                >
                  Regulamin
                </Link>
              </li>
            </ul>
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
        <p className="mt-8 border-t border-slate-200 pt-6 text-xs leading-relaxed text-slate-500">
          © {KILOMETROWKA_YEAR} Kilometrówka.app · Narzędzie pomocnicze — nie
          stanowi porady podatkowej, prawnej ani księgowej. W trybie Gościa dane
          ewidencji są przechowywane wyłącznie w przeglądarce (localStorage); po
          zalogowaniu — na serwerze (Neon, UE), zob. Polityka prywatności.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Kilometrówka.app · {OPERATOR.company}, {OPERATOR_ADDRESS} · NIP {OPERATOR.nip} ·{" "}
          <a href={`mailto:${OPERATOR.email}`} className="underline underline-offset-2 hover:text-slate-700">
            {OPERATOR.email}
          </a>{" "}
          ·{" "}
          <Link href="/regulamin" className="underline underline-offset-2 hover:text-slate-700">
            Regulamin
          </Link>{" "}
          ·{" "}
          <Link href="/polityka-prywatnosci" className="underline underline-offset-2 hover:text-slate-700">
            Polityka prywatności
          </Link>
        </p>
      </div>
    </footer>
  );
}
