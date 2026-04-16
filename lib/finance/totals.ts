import { WorkEntry, Client, MonthlyTotals } from '@/lib/types'
import { calculateEarnings } from './earnings'

export function calculateTotals(
  entries: WorkEntry[],
  clients: Client[],
  eurRate: number
): MonthlyTotals {
  const clientMap = new Map(clients.map((c) => [c.id, c]))

  let totalHours = 0
  let totalDays = 0
  let earningsPLN = 0
  let earningsEUR = 0

  let vacationDays = 0
  let sickDays = 0
  let daysOff = 0

  for (const entry of entries) {
    const client = entry.client_id
      ? clientMap.get(entry.client_id)
      : null

    if (entry.status === 'worked') {
      totalDays++
      totalHours += entry.hours ?? 0

      if (client) {
        const earnings = calculateEarnings(entry, client, eurRate)

        earningsPLN += earnings.amountInPLN
        earningsEUR += earnings.amountInEUR
      }
    }

    if (entry.status === 'vacation') vacationDays++
    if (entry.status === 'sick_leave') sickDays++
    if (entry.status === 'day_off') daysOff++
  }

  return {
    totalHours,
    totalDays,
    earningsPLN,
    earningsEUR,
    totalEarningsAllPLN: earningsPLN + earningsEUR * eurRate,
    vacationDays,
    sickDays,
    daysOff,
  }
}