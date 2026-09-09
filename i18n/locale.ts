import { match as matchLocale } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'

import {
  APP_LOCALES,
  COUNTRY_TO_LOCALE,
  DEFAULT_LOCALE,
  isAppLocale,
  type AppLocale,
} from './config'

/**
 * Negocjacja jezyka interfejsu — CZYSTA funkcja, bez `next/*`, bez `window`.
 *
 * Wydzielona celowo: to jedyna regula w calym systemie, ktora decyduje „jaki
 * jezyk widzi ten uzytkownik". Middleware, testy i ewentualne przyszle
 * wejscia (API, e-mail) maja czytac dokladnie ta sama funkcje, zamiast
 * powielac warunki.
 *
 * NADRZEDNA ZASADA: swiadomy wybor uzytkownika zawsze wygrywa z automatyczna
 * detekcja. Geolokalizacja jest wylacznie PIERWSZA PODPOWIEDZIA — nigdy nie
 * nadpisuje decyzji, ktora uzytkownik juz podjal.
 */

/** Skad wziela sie decyzja — do logow, testow i naglowka diagnostycznego. */
export type LocaleSource =
  | 'explicit'
  | 'user'
  | 'cookie'
  | 'geo'
  | 'header'
  | 'default'

export interface LocaleResolutionInput {
  /**
   * Jezyk wskazany wprost w tym zadaniu: prefiks sciezki (`/de/dashboard`)
   * albo parametr przelacznika. Najwyzszy priorytet — uzytkownik wlasnie
   * kliknal albo wszedl w konkretny adres.
   */
  explicit?: string | null
  /** `preferred_locale` z konta — synchronizuje wybor miedzy urzadzeniami. */
  userPreference?: string | null
  /** Ciasteczko zapisane przez `LocaleSwitcher`. */
  cookie?: string | null
  /** `x-vercel-ip-country`, np. "DE". */
  country?: string | null
  /** Surowy naglowek `Accept-Language`. */
  acceptLanguage?: string | null
}

export interface LocaleResolution {
  locale: AppLocale
  source: LocaleSource
}

/**
 * Jezyk z `Accept-Language`. Parsowanie i wybor najlepszego dopasowania robia
 * te same biblioteki, ktorych uzywa `next-intl` (`negotiator` +
 * `@formatjs/intl-localematcher`) — wlasny parser gubilby wagi `q` i
 * dopasowanie `de-AT` → `de`.
 */
function fromAcceptLanguage(header: string): AppLocale | null {
  let requested: string[]
  try {
    requested = new Negotiator({ headers: { 'accept-language': header } }).languages()
  } catch {
    // Naglowek bywa smieciem (boty, stare proxy) — to nie jest powod, zeby
    // wywrocic renderowanie strony.
    return null
  }

  // `*` znaczy „cokolwiek" i zawsze dopasowalby sie do jezyka domyslnego,
  // przez co ta galaz udawalaby decyzje uzytkownika.
  const candidates = requested.filter((tag) => tag !== '*')
  if (candidates.length === 0) return null

  try {
    const matched = matchLocale(candidates, APP_LOCALES as readonly string[], DEFAULT_LOCALE, {
      algorithm: 'best fit',
    })
    // `matchLocale` przy braku dopasowania zwraca podana wartosc domyslna —
    // to nie jest sygnal od uzytkownika, wiec oddajemy `null` i schodzimy
    // nizej w priorytetach.
    if (!isAppLocale(matched)) return null
    const explicitlyRequested = candidates.some((tag) =>
      tag.toLowerCase().split('-')[0] === matched,
    )
    return explicitlyRequested ? matched : null
  } catch {
    return null
  }
}

/**
 * Kolejnosc priorytetow (od najmocniejszego):
 *
 *  1. `explicit`  — jezyk w adresie / z przelacznika,
 *  2. `user`      — `preferred_locale` zalogowanego konta,
 *  3. `cookie`    — poprzedni wybor w tej przegladarce,
 *  4. `geo`       — `x-vercel-ip-country` (tylko jako pierwsza podpowiedz),
 *  5. `header`    — `Accept-Language`,
 *  6. `default`   — polski.
 *
 * Kazda niepoprawna wartosc (np. podrobione ciasteczko `?><script>`) jest
 * po prostu pomijana — nigdy nie wysadza requestu.
 */
export function resolveLocale(input: LocaleResolutionInput = {}): LocaleResolution {
  if (isAppLocale(input.explicit)) return { locale: input.explicit, source: 'explicit' }
  if (isAppLocale(input.userPreference)) return { locale: input.userPreference, source: 'user' }
  if (isAppLocale(input.cookie)) return { locale: input.cookie, source: 'cookie' }

  const country = input.country?.trim().toUpperCase()
  if (country) {
    const geoLocale = COUNTRY_TO_LOCALE[country]
    if (geoLocale) return { locale: geoLocale, source: 'geo' }
  }

  if (input.acceptLanguage) {
    const headerLocale = fromAcceptLanguage(input.acceptLanguage)
    if (headerLocale) return { locale: headerLocale, source: 'header' }
  }

  return { locale: DEFAULT_LOCALE, source: 'default' }
}
