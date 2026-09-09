import { INTL_LOCALE, type AppLocale } from '@/i18n/config'

/**
 * Strefa aplikacji. Pinujemy ja w KAZDYM formatterze daty, zeby serwer
 * (UTC) i przegladarka uzytkownika renderowaly identyczny tekst.
 *
 * STREFA NIE JEST ZWIAZANA Z JEZYKIEM INTERFEJSU. Uzytkownik moze miec UI po
 * niemiecku i strefe `Europe/Warsaw` — albo odwrotnie. Zmiana jezyka nie
 * przesuwa ani jednej daty, bo to dana biznesowa konta, a nie preferencja
 * prezentacji.
 */
const APP_TIME_ZONE = 'Europe/Warsaw'

/** Placeholder braku danych — jedyne miejsce w repo, w którym jest definiowany. */
export const NO_DATA = '—' as const

const dateCache = new Map<string, Intl.DateTimeFormat>()
const numberCache = new Map<string, Intl.NumberFormat>()
const relativeCache = new Map<AppLocale, Intl.RelativeTimeFormat>()

/**
 * Tag BCP-47 dla `Intl`. `en` znaczy w produkcie `en-GB` — inaczej daty
 * wygladalyby amerykansko ("September 9, 2026" zamiast "9 September 2026").
 */
export function intlTag(locale: AppLocale): string {
  return INTL_LOCALE[locale]
}

/** Konstruktory Intl są drogie — cache po jezyku i serializacji opcji. */
export function dateFormatter(
  locale: AppLocale,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`
  let f = dateCache.get(key)
  if (!f) {
    f = new Intl.DateTimeFormat(intlTag(locale), { timeZone: APP_TIME_ZONE, ...options })
    dateCache.set(key, f)
  }
  return f
}

export function numberFormatter(
  locale: AppLocale,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`
  let f = numberCache.get(key)
  if (!f) {
    f = new Intl.NumberFormat(intlTag(locale), options)
    numberCache.set(key, f)
  }
  return f
}

export function relativeFormatter(locale: AppLocale): Intl.RelativeTimeFormat {
  let f = relativeCache.get(locale)
  if (!f) {
    f = new Intl.RelativeTimeFormat(intlTag(locale), { numeric: 'auto' })
    relativeCache.set(locale, f)
  }
  return f
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Parsuje "YYYY-MM-DD" na Date w południe UTC.
 * Południe eliminuje przeskok dnia przy dowolnej strefie i przy DST.
 * Nigdy nie używaj new Date("YYYY-MM-DD") bezpośrednio.
 *
 * Zakresy sprawdzamy jawnie, bo Date.UTC cicho przewija ("2026-13-01" na
 * styczeń 2027, "2026-02-30" na marzec) — a cicho przewinięta data to
 * dokładnie ten błąd, przez który karta pokazywała grudzień zamiast sierpnia.
 */
export function parseIsoDate(iso: string): Date {
  const m = ISO_DATE.exec(iso)
  if (!m) throw new Error('Invalid IsoDate: ' + iso)
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(Date.UTC(year, month - 1, day, 12))
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error('Invalid IsoDate: ' + iso)
  }
  return date
}
