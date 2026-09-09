import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import { DEFAULT_LOCALE, type AppLocale } from './config'
import { loadMessages } from './messages'
import { routing } from './routing'

/**
 * Konfiguracja requestu dla `next-intl`.
 *
 * `timeZone` NIE jest tu ustawiana celowo. Strefa czasowa to dana biznesowa
 * konta (`Europe/Warsaw` niezaleznie od tego, czy interfejs jest po niemiecku)
 * i przypina ja `lib/format` — zwiazanie jej z jezykiem przesuwaloby
 * uzytkownikowi daty przy samej zmianie UI.
 *
 * Formatowanie liczb, kwot i dat NIE idzie przez `useFormatter()` tylko przez
 * `lib/format` — jedyna warstwe w repo, ktora zamienia liczby na tekst
 * (pilnuje tego regula ESLint `no-restricted-syntax`).
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale: AppLocale = hasLocale(routing.locales, requested) ? requested : DEFAULT_LOCALE

  return {
    locale,
    messages: await loadMessages(locale),
    /**
     * Brak klucza nie moze wywalic strony w produkcji. Zwracamy sciezke
     * klucza — jest natychmiast widoczna w UI i w testach struktury
     * (`__test__/i18n/messages.test.ts`), wiec luka nie przechodzi cicho.
     */
    getMessageFallback({ key, namespace }) {
      return namespace ? `${namespace}.${key}` : key
    },
  }
})
