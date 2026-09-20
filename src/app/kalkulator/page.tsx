import CalculatorApp from "@/components/CalculatorApp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kalkulator i ewidencja — Kilometrówka.app",
  description:
    "Dodawaj przejazdy, licz kilometrówkę według stawek 2026, eksportuj CSV/Excel i obliczaj diety krajowe.",
};

export default function KalkulatorPage() {
  return <CalculatorApp />;
}
