import { plPL } from "@clerk/localizations";

/**
 * plPL from @clerk/localizations leaves several keys untranslated (Clerk
 * falls back to English, e.g. the sign-up password placeholder "Create a
 * password"). Fill them in so the auth forms are fully Polish.
 */
export const clerkLocalization = {
  ...plPL,
  formFieldInputPlaceholder__signUpPassword: "Utwórz hasło",
  formFieldInputPlaceholder__username: "Wpisz nazwę użytkownika",
  formFieldInputPlaceholder__emailAddress: "np. jan.kowalski@example.com",
  formFieldInput__emailAddress_format: "Przykładowy format: imie@example.com",
  signIn: {
    ...plPL.signIn,
    passwordCompromised: {
      ...plPL.signIn?.passwordCompromised,
      title: "Hasło zostało ujawnione",
    },
    passwordUntrusted: {
      ...plPL.signIn?.passwordUntrusted,
      title: "Hasło niezaufane",
    },
    protectCheck: {
      title: "Weryfikujemy żądanie",
      subtitle: "Poczekaj chwilę, sprawdzamy żądanie.",
      loading: "Ładowanie…",
      retryButton: "Spróbuj ponownie",
    },
  },
  signUp: {
    ...plPL.signUp,
    protectCheck: {
      title: "Weryfikujemy żądanie",
      subtitle: "Poczekaj chwilę, sprawdzamy żądanie.",
      loading: "Ładowanie…",
      retryButton: "Spróbuj ponownie",
    },
    legalConsent: {
      ...plPL.signUp?.legalConsent,
      checkbox: {
        ...plPL.signUp?.legalConsent?.checkbox,
        label__termsOfServiceAndPrivacyPolicy:
          'Akceptuję {{ termsOfServiceLink || link("Regulamin") }} i zapoznałem(-am) się z {{ privacyPolicyLink || link("Polityką prywatności") }}',
      },
    },
  },
  userButton: {
    ...plPL.userButton,
    action__openUserMenu: "Otwórz menu użytkownika",
    action__closeUserMenu: "Zamknij menu użytkownika",
  },
  unstable__errors: {
    ...plPL.unstable__errors,
    form_code_incorrect: "Nieprawidłowy kod. Sprawdź i spróbuj ponownie.",
    form_param_type_invalid: "Nieprawidłowa wartość pola.",
    form_param_type_invalid__email_address: "Podaj poprawny adres e-mail.",
    form_password_compromised__sign_in:
      "To hasło pojawiło się w wycieku danych. Zresetuj hasło, aby kontynuować.",
    form_new_password_matches_current:
      "Nowe hasło nie może być takie samo jak obecne.",
    form_password_matches_identifier:
      "Hasło nie może być takie samo jak adres e-mail lub nazwa użytkownika.",
    form_password_untrusted__sign_in:
      "Twoje hasło mogło zostać ujawnione. Zaloguj się inną metodą — po zalogowaniu trzeba będzie zresetować hasło.",
  },
};
