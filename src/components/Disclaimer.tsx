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
