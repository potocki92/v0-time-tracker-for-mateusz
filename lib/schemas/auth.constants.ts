/**
 * Minimum password length used for both login and signup.
 *
 * Osobny modul, bo formularz rejestracji czyta te stala po stronie klienta —
 * import z `auth.schema.ts` wciagalby razem z nia calego `zod` (~14 kB gzip)
 * do bundla trasy `/auth/sign-up`.
 */
export const PASSWORD_MIN = 8
