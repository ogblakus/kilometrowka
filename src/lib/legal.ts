/**
 * Operator (Usługodawca) data and the legal texts shown at checkout.
 * Single source of truth — used by the footer, /kup, /konto, the checkout
 * API (consent evidence) and the legal pages.
 */
export const OPERATOR = {
  person: "Paweł Michalak",
  company: "Paweł Michalak Usługi",
  nip: "7773431444",
  street: "os. Zygmunta III Wazy 2/46",
  postalCity: "62-020 Swarzędz",
  email: "djpablo312@icloud.com",
} as const;

export const OPERATOR_ADDRESS = `${OPERATOR.street}, ${OPERATOR.postalCity}`;

/** Not a VAT payer — never print "Faktura VAT". */
export const VAT_NOTE =
  "cena ostateczna; sprzedawca zwolniony z VAT na podstawie art. 113 ust. 1 ustawy o VAT";

export const TERMS_VERSION = "1.0";
export const TERMS_EFFECTIVE_DATE = "04.10.2026";
export const PRIVACY_VERSION = "1.0";
export const PRIVACY_EFFECTIVE_DATE = "04.10.2026";

export type BillingInterval = "month" | "year";

export function intervalLabel(i: BillingInterval): { period: string; adj: string } {
  return i === "month"
    ? { period: "miesiąc", adj: "miesięczny" }
    : { period: "rok", adj: "roczny" };
}

/** Checkbox 1 (required) — text depends on the selected variant. */
export function termsConsentText(interval: BillingInterval, price: number): string {
  const { period } = intervalLabel(interval);
  return (
    "Zapoznałem(-am) się z Regulaminem i akceptuję jego treść. Zapoznałem(-am) się z Polityką prywatności. " +
    `Rozumiem, że Plan Premium jest subskrypcją odnawianą automatycznie co ${period} za ${price} zł ` +
    "(cena ostateczna, sprzedawca zwolniony z VAT), dopóki z niej nie zrezygnuję; rezygnacja działa z końcem opłaconego okresu."
  );
}

/** Checkbox 2 (required) — art. 21 ust. 2 u.p.k. request for immediate performance. */
export const EARLY_START_TEXT =
  "Żądam rozpoczęcia świadczenia usługi Premium przed upływem 14-dniowego terminu do odstąpienia od umowy. " +
  "Przyjmuję do wiadomości, że utracę prawo odstąpienia od umowy po pełnym wykonaniu usługi przez Usługodawcę, " +
  "a jeżeli odstąpię od umowy wcześniej, zapłacę kwotę proporcjonalną do okresu, w którym korzystałem(-am) z Premium " +
  "do chwili odstąpienia (§ 10 Regulaminu).";

export type BusinessPurpose = "non_professional" | "professional";

export const BUSINESS_PURPOSE_LABELS: Record<BusinessPurpose, string> = {
  non_professional: "umowa nie ma dla mnie charakteru zawodowego",
  professional: "umowa ma dla mnie charakter zawodowy",
};

/** Shown in Stripe Checkout above the pay button (max 1200 chars). */
export const STRIPE_SUBMIT_MESSAGE =
  "Klikając przycisk, zamawiasz Premium z obowiązkiem zapłaty. Premium aktywuje się od razu po płatności. " +
  "Subskrypcja odnawia się automatycznie; możesz zrezygnować w każdej chwili w ustawieniach Konta lub e-mailem — " +
  "rezygnacja działa z końcem opłaconego okresu. Cena ostateczna, sprzedawca zwolniony z VAT (art. 113 ust. 1 ustawy o VAT).";

/** Pre-filled e-mail for withdrawal (Załącznik nr 1 do Regulaminu). */
export function withdrawalMailto(accountEmail: string | null): string {
  const subject = "Odstąpienie od umowy — Kilometrówka.app Premium";
  const body = [
    `Adresat: ${OPERATOR.company}, ${OPERATOR_ADDRESS}, e-mail: ${OPERATOR.email}`,
    "",
    "Niniejszym informuję o moim odstąpieniu od umowy o świadczenie usługi cyfrowej: Kilometrówka.app — Plan Premium.",
    "",
    "Data zawarcia umowy: ",
    "Imię i nazwisko: ",
    `Adres e-mail Konta: ${accountEmail ?? ""}`,
    "Adres: ",
    `Data: ${new Date().toLocaleDateString("pl-PL")}`,
  ].join("\n");
  return `mailto:${OPERATOR.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
