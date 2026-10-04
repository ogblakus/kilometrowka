import type { Metadata } from "next";
import AccountSettings from "@/components/AccountSettings";

export const metadata: Metadata = {
  title: "Ustawienia konta",
  robots: { index: false, follow: false },
};

export default function KontoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Ustawienia konta</h1>
      <p className="mt-2 text-sm text-slate-600">
        Subskrypcja, dane do ewidencji i usunięcie konta.
      </p>
      <div className="mt-8">
        <AccountSettings />
      </div>
    </div>
  );
}
