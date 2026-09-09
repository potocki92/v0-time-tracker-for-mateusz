/**
 * Jedyne zrodlo prawdy o jezykach interfejsu.
 *
 * WAZNE ROZROZNIENIE: `AppLocale` to JEZYK INTERFEJSU uzytkownika aplikacji.
 * To NIE jest to samo, co `client.locale`, waluta faktury ani strefa czasowa
 * konta — te trzy sa danymi biznesowymi i zmieniaja sie niezaleznie
 * (patrz `docs/i18n.md`, sekcja „Czego NIE wiazac z jezykiem UI").
 *
 * Dodanie kolejnego jezyka = dopisanie kodu do `APP_LOCALES`, uzupelnienie
 * `INTL_LOCALE`/`OG_LOCALE`/`LOCALE_LABELS` (TypeScript wymusi komplet przez
 * `Record<AppLocale, …>`) i skopiowanie katalogu `messages/<locale>`.
 */

export const APP_LOCALES = ['pl', 'de', 'en'] as const

export type AppLocale = (typeof APP_LOCALES)[number]

/** Jezyk bazowy: nieprefiksowane URL-e (`/dashboard`) i fallback tlumaczen. */
export const DEFAULT_LOCALE: AppLocale = 'pl'

/**
 * Ciasteczko z decyzja uzytkownika. Nazwa jest ta sama, ktorej uzywa
 * `next-intl` — dzieki temu middleware biblioteki czyta dokladnie to, co
 * zapisal `LocaleSwitcher`.
 */
export const LOCALE_COOKIE = 'NEXT_LOCALE'

/** Rok. Wybor jezyka ma przetrwac zamkniecie przegladarki. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/** Naglowek geolokalizacji Vercela — jedyne zrodlo kraju, ktorego uzywamy. */
export const GEO_COUNTRY_HEADER = 'x-vercel-ip-country'

/**
 * Tagi BCP-47 dla `Intl`. Rozdzielone od kodu jezyka, bo `en` ma w produkcie
 * znaczyc `en-GB` (data „9 September 2026", nie „September 9, 2026").
 */
export const INTL_LOCALE: Record<AppLocale, string> = {
  pl: 'pl-PL',
  de: 'de-DE',
  en: 'en-GB',
}

/** `og:locale` — OpenGraph chce podkreslnika, nie mysinika. */
export const OG_LOCALE: Record<AppLocale, string> = {
  pl: 'pl_PL',
  de: 'de_DE',
  en: 'en_GB',
}

/**
 * Etykiety w przelaczniku jezyka. Nazwa ZAWSZE w jezyku docelowym — Niemiec
 * szuka „Deutsch", nie „niemiecki". Sama flaga nie wystarcza (jezyk to nie
 * kraj), wiec obok kodu stoi pelna nazwa.
 */
export const LOCALE_LABELS: Record<AppLocale, { code: string; native: string }> = {
  pl: { code: 'PL', native: 'Polski' },
  de: { code: 'DE', native: 'Deutsch' },
  en: { code: 'EN', native: 'English' },
}

/**
 * Kraj z geolokalizacji → jezyk. Celowo MINIMALNA mapa: tylko rynki, dla
 * ktorych kraj jednoznacznie wskazuje jezyk produktu. Reszta swiata jedzie
 * przez `Accept-Language`, ktory mowi o uzytkowniku wiecej niz adres IP
 * (Polak w Holandii ma polska przegladarke, nie holenderski adres).
 */
export const COUNTRY_TO_LOCALE: Readonly<Record<string, AppLocale>> = {
  PL: 'pl',
  DE: 'de',
}

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (APP_LOCALES as readonly string[]).includes(value)
}

/**
 * Zawezenie parametru trasy do `AppLocale`.
 *
 * Next generuje typy segmentow dynamicznych jako `string`, a nieznany jezyk
 * jest odcinany przez `notFound()` w `app/[locale]/layout.tsx` — do stron
 * dociera wiec zawsze wartosc poprawna. Fallback jest tu wylacznie po to,
 * zeby typ byl uczciwy, a nie zeby maskowac blad routingu.
 */
export function toAppLocale(value: string): AppLocale {
  return isAppLocale(value) ? value : DEFAULT_LOCALE
}
