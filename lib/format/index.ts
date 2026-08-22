/**
 * Jedyna warstwa w repo, która zamienia liczby i daty na tekst.
 *
 * Granica warstw: `lib/metrics` zwraca LICZBY, `lib/format` zwraca STRINGI,
 * komponenty nie robią ani arytmetyki, ani formatowania. Pilnuje tego test
 * `__test__/architecture/no-adhoc-formatting.test.ts` i reguła ESLint.
 */
export { NO_DATA, parseIsoDate } from './intl'
export {
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
export {
  formatMoney,
  formatMoneyCompact,
  formatMoneyDelta,
  formatRate,
  toMinor,
  type Currency,
} from './money'
export { formatCount, formatHours, formatNumber, formatPercent } from './number'
