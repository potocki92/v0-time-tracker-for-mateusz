export const APP_LOCALE = 'pl-PL' as const
/** Strefa aplikacji. Pinujemy ja w KAZDYM formatterze daty, zeby serwer
 *  (UTC) i przegladarka uzytkownika renderowaly identyczny tekst. */
const APP_TIME_ZONE = 'Europe/Warsaw'
/** Placeholder braku danych — jedyne miejsce w repo, w którym jest definiowany. */
export const NO_DATA = '—' as const

const dateCache = new Map<string, Intl.DateTimeFormat>()
const numberCache = new Map<string, Intl.NumberFormat>()

/** Konstruktory Intl są drogie — cache po serializacji opcji. */
export function dateFormatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = JSON.stringify(options)
  let f = dateCache.get(key)
  if (!f) {
    f = new Intl.DateTimeFormat(APP_LOCALE, { timeZone: APP_TIME_ZONE, ...options })
    dateCache.set(key, f)
  }
  return f
}

export function numberFormatter(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = JSON.stringify(options)
  let f = numberCache.get(key)
  if (!f) {
    f = new Intl.NumberFormat(APP_LOCALE, options)
    numberCache.set(key, f)
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
