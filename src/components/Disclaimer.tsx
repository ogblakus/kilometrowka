export default function Disclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        <strong>Uwaga:</strong> narzędzie pomocnicze, nie porada podatkowa.
        Oficjalne stawki kilometrówki dotyczą głównie zwrotu kosztów
        pracownikowi za używanie prywatnego pojazdu. Zasady podatkowe JDG mogą
        się różnić.
      </p>
    );
  }

  return (
    <aside className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
      <p className="font-semibold">Zastrzeżenie</p>
      <p className="mt-1">
        Kilometrówka.app to narzędzie pomocnicze do ewidencji przejazdów i
        szacowania należności. <strong>Nie stanowi porady podatkowej, prawnej
        ani księgowej.</strong> Oficjalne stawki kilometrówki (Dz.U. 2023 poz. 5)
        służą przede wszystkim do zwrotu kosztów pracownikowi za używanie
        prywatnego samochodu / motocykla / motoroweru do celów służbowych.
        Zasady rozliczeń podatkowych jednoosobowej działalności gospodarczej
        (JDG) mogą się różnić — skonsultuj się z księgowym lub doradcą
        podatkowym.
      </p>
    </aside>
  );
}

/** Zakres i uproszczenia kalkulatora diet krajowych. */
export function DietaDisclaimer() {
  return (
    <aside className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
      <p>
        <strong>Uwaga:</strong> narzędzie pomocnicze, nie porada podatkowa.
        Liczymy według §§ 7–9 rozporządzenia Ministra Pracy i Polityki
        Społecznej z 29.01.2013 r. w sprawie należności z tytułu podróży
        służbowej (t.j. Dz.U. 2023 poz. 2190) — tylko podróże krajowe.
      </p>
      <p className="mt-1">Uproszczenia:</p>
      <ul className="mt-0.5 list-disc space-y-0.5 pl-4">
        <li>
          czas liczymy według wpisanych godzin, bez korekty zmiany czasu
          letni/zimowy;
        </li>
        <li>
          posiłki odejmujemy łącznie od sumy diet (bez podziału na doby);
          dieta nie spada poniżej 0 zł;
        </li>
        <li>
          ryczałt za nocleg zakłada, że przez całą noc był nocleg (nie
          przejazd), bez rachunku i bez noclegu zapewnionego — nie sprawdzamy
          też, czy możliwy był codzienny powrót;
        </li>
        <li>
          nie uwzględniamy delegacji do miejsca zamieszkania ani stawek
          ustalonych przez pracodawcę.
        </li>
      </ul>
      <p className="mt-1">
        Według interpretacji podatkowych przedsiębiorca na JDG może wliczyć w
        koszty własną dietę, ale nie ryczałt za nocleg ani za dojazdy.
      </p>
    </aside>
  );
}
