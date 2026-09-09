import { defineRouting } from 'next-intl/routing'

import { APP_LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from './config'

/**
 * Routing jezykowy.
 *
 * `localePrefix: 'as-needed'` — polski, jako jezyk bazowy, zostaje na
 * dotychczasowych adresach (`/`, `/dashboard`), wiec ani jeden istniejacy
 * link ani zakladka uzytkownika nie przestaje dzialac. Pozostale jezyki
 * dostaja jednoznaczny prefiks (`/de/dashboard`, `/en/dashboard`), dzieki
 * czemu kazda wersja jezykowa ma WLASNY, indeksowalny adres — bez tego
 * `hreflang` i `canonical` nie mialyby na co wskazywac.
 *
 * Negocjacja jezyka jest NASZA (`i18n/locale.ts`) — musi uwzglednic
 * geolokalizacje Vercela i preferencje konta, o ktorych `next-intl` nie wie.
 * Middleware wpisuje jej wynik do ciasteczka NA ZADANIU, zanim odda sterowanie
 * bibliotece; `localeDetection` zostaje wiec wlaczone, ale biblioteka nigdy
 * nie dochodzi do wlasnego parsowania `Accept-Language` — ciasteczko jest
 * zawsze ustawione i ma wyzszy priorytet.
 *
 * Efekt uboczny jest zamierzony: `syncCookie` w `next-intl` widzi ciasteczko
 * zgodne z rozwiazanym jezykiem i NIE zapisuje go w odpowiedzi. Trwale
 * zapamietanie jezyka nalezy wylacznie do `LocaleSwitcher`, czyli do
 * SWIADOMEJ decyzji uzytkownika — wykrycie po IP nigdy sie nie utrwala.
 */
export const routing = defineRouting({
  locales: APP_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'as-needed',
  localeDetection: true,
  localeCookie: {
    name: LOCALE_COOKIE,
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: 'lax',
  },
})
