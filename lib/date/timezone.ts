/**
 * Data i godzina w strefie IANA.
 *
 * Automat zapisu pracy dziala „o 19:00 czasu uzytkownika", a serwer stoi w UTC.
 * Sztywne dodanie jednej czy dwoch godzin rozjezdza sie dwa razy w roku, wiec
 * jedynym zrodlem prawdy jest tu baza stref przegladarki/Node (`Intl`).
 *
 * To warstwa arytmetyki dat, nie formatowania: zwraca liczby i klucze
 * kalendarzowe "YYYY-MM-DD", nigdy tekstu dla uzytkownika.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Formatery sa drogie w konstrukcji, a automat wola je raz na dzien kalendarzowy
 * w petli nadrabiania — jeden cache na strefe wystarcza.
 */
const formatters = new Map<string, Intl.DateTimeFormat>()

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  const cached = formatters.get(timeZone)
  if (cached) return cached

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  formatters.set(timeZone, formatter)
  return formatter
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatterFor(timeZone).format(new Date())
    return true
  } catch {
    return false
  }
}

export interface ZonedParts {
  /** Data kalendarzowa w strefie, "YYYY-MM-DD". */
  date: string
  /** Minuty od lokalnej polnocy (0..1439). */
  minutes: number
}

function rawParts(instant: Date, timeZone: string) {
  const parts = formatterFor(timeZone).formatToParts(instant)
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0')

  // `hour12: false` daje w niektorych wersjach ICU godzine 24 zamiast 0.
  const hour = read('hour') % 24

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour,
    minute: read('minute'),
    second: read('second'),
  }
}

/** Chwila UTC widziana jako data i godzina w podanej strefie. */
export function zonedParts(instant: Date, timeZone: string): ZonedParts {
  const { year, month, day, hour, minute } = rawParts(instant, timeZone)
  const pad = (value: number) => String(value).padStart(2, '0')

  return {
    date: `${year}-${pad(month)}-${pad(day)}`,
    minutes: hour * 60 + minute,
  }
}

/** Przesuniecie strefy wzgledem UTC w danej chwili, w milisekundach. */
function offsetMs(instant: Date, timeZone: string): number {
  const { year, month, day, hour, minute, second } = rawParts(instant, timeZone)
  return Date.UTC(year, month - 1, day, hour, minute, second) - instant.getTime()
}

/**
 * Lokalny czas scienny → chwila UTC.
 *
 * Dwa przebiegi wystarczaja: pierwszy zgaduje przesuniecie, drugi poprawia je
 * po stronie wyniku. Godzina, ktora wiosna nie istnieje, wypada po przeskoku —
 * czyli automat wykonuje zapis przy pierwszej dostepnej chwili po niej.
 */
export function zonedInstant(isoDate: string, minutes: number, timeZone: string): Date {
  if (!ISO_DATE.test(isoDate)) throw new Error(`Niepoprawna data ISO: ${isoDate}`)

  const [year, month, day] = isoDate.split('-').map(Number)
  const wallClock = Date.UTC(year, month - 1, day, Math.floor(minutes / 60), minutes % 60)

  const firstGuess = new Date(wallClock - offsetMs(new Date(wallClock), timeZone))
  return new Date(wallClock - offsetMs(firstGuess, timeZone))
}

/** "HH:mm" → minuty od polnocy. Zwraca `null` dla wartosci spoza formatu. */
export function parseClockMinutes(value: string): number | null {
  const match = /^([01][0-9]|2[0-3]):([0-5][0-9])$/.exec(value)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}
