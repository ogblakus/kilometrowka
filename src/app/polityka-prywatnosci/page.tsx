import type { Metadata } from "next";
import LegalMarkdown from "@/components/LegalMarkdown";
import PrintButton from "@/components/PrintButton";
import { TERMS_EFFECTIVE_DATE, TERMS_VERSION } from "@/lib/legal";
import { POLITYKA_PRYWATNOSCI_MD } from "@/content/polityka-prywatnosci";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description: "Polityka prywatności Kilometrówka.app: administrator, dane, cele, odbiorcy, okresy przechowywania, prawa, cookies.",
};

// Drop the document title and the "Obowiązuje od" line — rendered below.
const BODY = POLITYKA_PRYWATNOSCI_MD.split("\n")
  .filter((l, i) => !(i < 4 && (/^# /.test(l) || /^Obowiązuje od:/.test(l))))
  .join("\n");

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Polityka prywatności</h1>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <span>
          Wersja {TERMS_VERSION} · obowiązuje od {TERMS_EFFECTIVE_DATE}
        </span>
        <PrintButton />
      </div>
      <div className="mt-6">
        <LegalMarkdown source={BODY} />
      </div>
    </article>
  );
}
