import type { Metadata } from "next";
import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export const metadata: Metadata = {
  title: "Płatność zakończona — Kilometrówka.app",
  description: "Dziękujemy za zakup Premium. Odblokuj funkcje w przeglądarce.",
};

export default function KupSukcesPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Suspense
        fallback={
          <p className="text-center text-sm text-slate-500">
            Weryfikacja płatności…
          </p>
        }
      >
        <SuccessClient />
      </Suspense>
    </div>
  );
}
