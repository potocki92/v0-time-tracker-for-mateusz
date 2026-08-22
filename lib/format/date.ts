import { APP_LOCALE, dateFormatter, NO_DATA, parseIsoDate } from './intl'

/**
 * Formatowanie dat kalendarzowych.
 *
 * Kontrakt: wejściem jest ZAWSZE IsoDate ("YYYY-MM-DD"), nigdy Date. Obiekt
 * Date niesie ze sobą godzinę i strefę, więc ten sam wpis renderował się
 * inaczej na serwerze (UTC) i w przeglądarce (Europe/Warsaw) — stąd błędy
 * hydracji i dni przesunięte o jeden. Data kalendarzowa nie ma godziny.
 *
 * Brak wartości daje NO_DATA, nigdy "Invalid Date" ani "undefined".
 */

/**
 * Wejściem jest data kalendarzowa "YYYY-MM-DD", miesiąc "YYYY-MM" albo klucz
 * ISO-tygodnia "YYYY-Www" — zależnie od funkcji. Brak wartości daje NO_DATA.
 */
type Maybe = string | null | undefined

const DATE_STYLES = {
  short: { day: '2-digit', month: '2-digit', year: 'numeric' },
  long: { day: 'numeric', month: 'long', year: 'numeric' },
  dayMonth: { day: 'numeric', month: 'short' },
  dayMonthLong: { day: 'numeric', month: 'long' },
} satisfies Record<string, Intl.DateTimeFormatOptions>

export type DateStyle = keyof typeof DATE_STYLES

/**
 * Dwuliterowe skróty dni tygodnia. Intl dla pl-PL daje "niedz." i "czw." —
 * za długie na kwadratowy kafelek daty. Indeks = Date#getUTCDay().
 */
const WEEKDAY_BADGE = ['ND', 'PN', 'WT', 'ŚR', 'CZ', 'PT', 'SO'] as const

const DAY_MS = 86_400_000
const ISO_MONTH = /^\d{4}-\d{2}$/
const ISO_WEEK_KEY = /^(\d{4})-W(\d{1,2})$/

/** Niepoprawna data jest w UI brakiem danych, a nie wyjątkiem. */
function toDate(iso: Maybe): Date | null {
  if (!iso) return null
  try {
    return parseIsoDate(iso)
  } catch {
    return null
  }
}

export function formatDate(iso: Maybe, style: DateStyle): string {
  const date = toDate(iso)
  return date ? dateFormatter(DATE_STYLES[style]).format(date) : NO_DATA
}

/** Kształt kafelka daty w karcie "Ostatnie wpisy": { month, weekday, day }. */
export function formatDayBadge(iso: Maybe): {
  month: string
  weekday: string
  day: string
} {
  const date = toDate(iso)
  if (!date) return { month: NO_DATA, weekday: NO_DATA, day: NO_DATA }
  return {
    month: dateFormatter({ month: 'short' }).format(date).toUpperCase(),
    weekday: WEEKDAY_BADGE[date.getUTCDay()],
    day: dateFormatter({ day: '2-digit' }).format(date),
  }
}

export function formatMonthTitle(month: Maybe): string {
  if (!month || !ISO_MONTH.test(month)) return NO_DATA
  const date = toDate(`${month}-01`)
  if (!date) return NO_DATA
  // pl-PL zwraca "sierpień 2026" — w nagłówku chcemy wielką literę.
  const label = dateFormatter({ month: 'long', year: 'numeric' }).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/**
 * Sama nazwa miesiąca w mianowniku ("sierpień" / "sie"), bez dnia i bez roku.
 * Przyjmuje IsoDate albo IsoMonth — nazwa miesiąca nie zależy od dnia.
 */
export function formatMonthName(value: Maybe, style: 'long' | 'short'): string {
  if (!value) return NO_DATA
  const date = toDate(ISO_MONTH.test(value) ? `${value}-01` : value)
  return date ? dateFormatter({ month: style }).format(date) : NO_DATA
}

export function formatWeekday(iso: Maybe, style: 'short' | 'long'): string {
  const date = toDate(iso)
  if (!date) return NO_DATA
  // pl-PL skraca z kropką ("śr."); w UI kropka jest szumem.
  return dateFormatter({ weekday: style }).format(date).replace(/\.$/, '')
}

/**
 * Numer i rok wg ISO-8601: tydzień zaczyna się w poniedziałek, a tydzień 1 to
 * ten, który zawiera pierwszy czwartek roku. Rok bierzemy z tego czwartku, więc
 * 1 stycznia potrafi należeć do ostatniego tygodnia roku poprzedniego.
 *
 * Przyjmuje IsoDate albo gotowy klucz "YYYY-Www" z lib/metrics — obie
 * prezentacje ("KW 34/2026" i "W34") liczą się z tego jednego miejsca, więc
 * nie mogą się rozjechać.
 */
function isoWeekParts(value: Maybe): { week: number; year: number } | null {
  if (!value) return null

  const key = ISO_WEEK_KEY.exec(value)
  if (key) return { week: Number(key[2]), year: Number(key[1]) }

  const date = toDate(value)
  if (!date) return null

  const thursday = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
  thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7))
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1)

  return {
    week: Math.ceil(((thursday.getTime() - yearStart) / DAY_MS + 1) / 7),
    year: thursday.getUTCFullYear(),
  }
}

/** Pełna prezentacja tygodnia: "KW 34/2026". */
export function formatIsoWeek(value: Maybe): string {
  const parts = isoWeekParts(value)
  return parts ? `KW ${parts.week}/${parts.year}` : NO_DATA
}

/** Skrócona prezentacja tego samego tygodnia: "W34" — oś wykresu, wąskie karty. */
export function formatIsoWeekShort(value: Maybe): string {
  const parts = isoWeekParts(value)
  return parts ? `W${parts.week}` : NO_DATA
}

/** Zakres dat ze skróceniem wspólnego miesiąca i roku: "17-23.08.2026". */
export function formatDateRange(fromIso: Maybe, toIso: Maybe): string {
  if (!fromIso || !toIso || !toDate(fromIso) || !toDate(toIso)) return NO_DATA

  const [fromYear, fromMonth, fromDay] = fromIso.split('-')
  const [toYear, toMonth, toDay] = toIso.split('-')

  if (fromYear === toYear && fromMonth === toMonth) {
    return `${fromDay}-${toDay}.${fromMonth}.${fromYear}`
  }
  if (fromYear === toYear) {
    return `${fromDay}.${fromMonth}-${toDay}.${toMonth}.${fromYear}`
  }
  return `${fromDay}.${fromMonth}.${fromYear}-${toDay}.${toMonth}.${toYear}`
}

const relativeFormatter = new Intl.RelativeTimeFormat(APP_LOCALE, { numeric: 'auto' })

/** "dziś" | "wczoraj" | "jutro" | "za 7 dni" | "7 dni temu". */
export function formatRelativeDay(iso: Maybe, todayIso: Maybe): string {
  const date = toDate(iso)
  const today = toDate(todayIso)
  if (!date || !today) return NO_DATA

  const days = Math.round((date.getTime() - today.getTime()) / DAY_MS)
  // Intl dla pl-PL mówi "dzisiaj"; w produkcie od zawsze jest "dziś".
  return days === 0 ? 'dziś' : relativeFormatter.format(days, 'day')
}
