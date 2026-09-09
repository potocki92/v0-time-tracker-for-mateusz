/**
 * Jedyna warstwa w repo, która zamienia liczby i daty na tekst.
 *
 * Granica warstw: `lib/metrics` zwraca LICZBY, `lib/format` zwraca STRINGI,
 * komponenty nie robią ani arytmetyki, ani formatowania. Pilnuje tego test
 * `__test__/architecture/no-adhoc-formatting.test.ts` i reguła ESLint.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * JEZYK
 *
 * Kazdy formatter jest sparametryzowany jezykiem interfejsu — nie ma juz
 * globalnej stalej `pl-PL`. Wiazanie robi sie RAZ, na granicy komponentu:
 *
 *   Server Component:  const f = await getFormat()
 *   Client Component:  const f = useFormat()
 *   Modul czysty:      const f = createFormat(locale)
 *
 * a potem `f.money(...)`, `f.hours(...)`, `f.date(...)`.
 *
 * Waluta i strefa czasowa NIE ida za jezykiem: `f.money(1000, 'EUR')` to
 * zawsze 10 EUR, a data zawsze liczy sie w strefie konta. Jezyk zmienia
 * wylacznie ZAPIS.
 */

import type { AppLocale } from '@/i18n/config'

import {
  formatDate,
  formatDateRange,
  formatDayBadge,
  formatIsoWeek,
  formatIsoWeekShort,
  formatMonthName,
  formatMonthTitle,
  formatRelativeDay,
  formatWeekday,
  type DateStyle,
} from './date'
import {
  formatMoney,
  formatMoneyCompact,
  formatMoneyDelta,
  formatRate,
  type Currency,
} from './money'
import { formatCount, formatHours, formatNumber, formatPercent } from './number'

export { NO_DATA, parseIsoDate } from './intl'
export { toMinor, type Currency } from './money'
export type { DateStyle } from './date'

/** Komplet formatterow zwiazanych z jednym jezykiem interfejsu. */
export interface AppFormat {
  locale: AppLocale

  date(iso: string | null | undefined, style: DateStyle): string
  dateRange(fromIso: string | null | undefined, toIso: string | null | undefined): string
  dayBadge(iso: string | null | undefined): { month: string; weekday: string; day: string }
  isoWeek(value: string | null | undefined): string
  isoWeekShort(value: string | null | undefined): string
  monthName(value: string | null | undefined, style: 'long' | 'short'): string
  monthTitle(month: string | null | undefined): string
  relativeDay(iso: string | null | undefined, todayIso: string | null | undefined): string
  weekday(iso: string | null | undefined, style: 'short' | 'long'): string

  money(minor: number | null | undefined, currency: Currency): string
  moneyCompact(minor: number | null | undefined, currency: Currency): string
  moneyDelta(minor: number | null | undefined, currency: Currency): string
  rate(minorPerHour: number | null | undefined, currency: Currency): string

  hours(hours: number | null | undefined, opts?: { decimals?: 0 | 1 }): string
  number(value: number | null | undefined, opts?: { decimals?: number }): string
  percent(ratio: number | null | undefined, opts?: { max?: number }): string
  /** @deprecated Uzyj komunikatu ICU `{count, plural, …}` z `messages/`. */
  count(count: number, forms: [string, string, string]): string
}

const cache = new Map<AppLocale, AppFormat>()

/**
 * Formattery zwiazane z jezykiem. Wynik jest memoizowany per jezyk, wiec
 * wywolanie w kazdym renderze nie kosztuje nic — same konstruktory `Intl`
 * cache'uje dodatkowo `./intl`.
 */
export function createFormat(locale: AppLocale): AppFormat {
  const cached = cache.get(locale)
  if (cached) return cached

  const format: AppFormat = {
    locale,
    date: (iso, style) => formatDate(locale, iso, style),
    dateRange: (from, to) => formatDateRange(locale, from, to),
    dayBadge: (iso) => formatDayBadge(locale, iso),
    isoWeek: (value) => formatIsoWeek(locale, value),
    isoWeekShort: (value) => formatIsoWeekShort(value),
    monthName: (value, style) => formatMonthName(locale, value, style),
    monthTitle: (month) => formatMonthTitle(locale, month),
    relativeDay: (iso, todayIso) => formatRelativeDay(locale, iso, todayIso),
    weekday: (iso, style) => formatWeekday(locale, iso, style),

    money: (minor, currency) => formatMoney(locale, minor, currency),
    moneyCompact: (minor, currency) => formatMoneyCompact(locale, minor, currency),
    moneyDelta: (minor, currency) => formatMoneyDelta(locale, minor, currency),
    rate: (minor, currency) => formatRate(locale, minor, currency),

    hours: (hours, opts) => formatHours(locale, hours, opts),
    number: (value, opts) => formatNumber(locale, value, opts),
    percent: (ratio, opts) => formatPercent(locale, ratio, opts),
    count: (count, forms) => formatCount(locale, count, forms),
  }

  cache.set(locale, format)
  return format
}
