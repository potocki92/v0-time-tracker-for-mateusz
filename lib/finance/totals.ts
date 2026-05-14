import { WorkEntry, Client, MonthlyTotals, AdvancedStats, DAY_NAMES_FULL } from '@/lib/types'
import {
  calculateEntryMoney,
  fallbackFromClient,
  resolveAppliedWorkType,
} from './entry-calculations'
import { add, convert, toMajor, zero } from './money'

export function calculateTotals(
  entries: WorkEntry[],
  clients: Client[],
  eurRate: number,
): MonthlyTotals {
  const clientMap = new Map(clients.map((c) => [c.id, c]))

  let totalHours = 0
  let totalDays = 0
  let earningsPLN = zero('PLN')
  let earningsEUR = zero('EUR')

  let vacationDays = 0
  let sickDays = 0
  let daysOff = 0

  for (const entry of entries) {
    const client = entry.client_id
      ? clientMap.get(entry.client_id)
      : undefined

    if (entry.status === 'worked') {
      totalDays++
      totalHours += entry.hours ?? 0

      const fallback = client
        ? fallbackFromClient(client)
        : { rate: 0, currency: 'PLN' as const, workType: 'hourly' as const }
      const money = calculateEntryMoney(entry, fallback)

      if (money.currency === 'EUR') {
        earningsEUR = add(earningsEUR, money)
      } else {
        earningsPLN = add(earningsPLN, money)
      }
    }

    if (entry.status === 'vacation') vacationDays++
    if (entry.status === 'sick_leave') sickDays++
    if (entry.status === 'day_off') daysOff++
  }

  const totalAllPLN = add(earningsPLN, convert(earningsEUR, 'PLN', eurRate))

  return {
    totalHours,
    totalDays,
    earningsPLN: toMajor(earningsPLN),
    earningsEUR: toMajor(earningsEUR),
    totalEarningsAllPLN: toMajor(totalAllPLN),
    vacationDays,
    sickDays,
    daysOff,
  }
}

/** Alias zachowany dla kompatybilności z istniejącymi importami */
export const calculateMonthlyTotals = calculateTotals

export function calculateAdvancedStats(
  entries: WorkEntry[],
  clients: Client[],
  eurRate: number,
  prevMonthEntries: WorkEntry[],
): AdvancedStats {
  const totals = calculateTotals(entries, clients, eurRate)
  const prevTotals = calculateTotals(prevMonthEntries, clients, eurRate)

  // Średnia stawka godzinowa ma sens tylko dla wpisów rozliczanych "hourly".
  // Mieszanie dniówek/akordu zaburzało wynik (dzielenie zarobków z piecework
  // przez sumę godzin).
  const clientMap = new Map(clients.map((c) => [c.id, c]))
  let hourlyEarningsPLN = zero('PLN')
  let hourlyEarningsEUR = zero('EUR')
  let hourlyHours = 0
  for (const entry of entries) {
    if (entry.status !== 'worked') continue
    const client = entry.client_id ? clientMap.get(entry.client_id) : undefined
    const fallback = client
      ? fallbackFromClient(client)
      : { rate: 0, currency: 'PLN' as const, workType: 'hourly' as const }
    if (resolveAppliedWorkType(entry, fallback) !== 'hourly') continue
    hourlyHours += entry.hours ?? 0
    const money = calculateEntryMoney(entry, fallback)
    if (money.currency === 'EUR') hourlyEarningsEUR = add(hourlyEarningsEUR, money)
    else hourlyEarningsPLN = add(hourlyEarningsPLN, money)
  }
  const hourlyTotalPLN = toMajor(
    add(hourlyEarningsPLN, convert(hourlyEarningsEUR, 'PLN', eurRate)),
  )
  const avgHourlyRate = hourlyHours > 0 ? hourlyTotalPLN / hourlyHours : 0

  const dayStats: Record<number, number> = {}
  for (const entry of entries) {
    if (entry.status === 'worked') {
      const dayOfWeek = new Date(entry.date).getDay()
      dayStats[dayOfWeek] = (dayStats[dayOfWeek] || 0) + (entry.hours || 0)
    }
  }
  const mostProductiveDayNum = Object.entries(dayStats)
    .sort(([, a], [, b]) => b - a)[0]?.[0]
  const mostProductiveDay = mostProductiveDayNum
    ? DAY_NAMES_FULL[parseInt(mostProductiveDayNum)]
    : '-'

  const comparisonWithLastMonth = prevTotals.totalEarningsAllPLN > 0
    ? ((totals.totalEarningsAllPLN - prevTotals.totalEarningsAllPLN) / prevTotals.totalEarningsAllPLN) * 100
    : 0

  let workStreak = 0
  const sortedEntries = [...entries].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
  for (const entry of sortedEntries) {
    if (entry.status === 'worked') {
      workStreak++
    } else {
      break
    }
  }

  return {
    avgHourlyRate,
    mostProductiveDay,
    comparisonWithLastMonth,
    workStreak,
    totalHoursMonth: totals.totalHours,
    totalDaysMonth: totals.totalDays,
  }
}
