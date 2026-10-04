import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-5xl flex-col items-center justify-center gap-4 px-4 py-10">
      <p className="max-w-md text-center text-sm text-slate-600">
        Zakładając konto, zawierasz umowę o prowadzenie Konta na zasadach{" "}
        <Link href="/regulamin" className="underline underline-offset-2">
          Regulaminu
        </Link>
        . Informacje o przetwarzaniu danych:{" "}
        <Link href="/polityka-prywatnosci" className="underline underline-offset-2">
          Polityka prywatności
        </Link>
        .
      </p>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/kalkulator"
      />
    </div>
  );
}
