import { WorkEntry, Client, MonthlyTotals } from '@/lib/types'
import {
  calculateEntryMoney,
  fallbackFromClient,
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

