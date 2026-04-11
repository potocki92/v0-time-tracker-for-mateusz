import { useMemo } from 'react'
import { WorkEntry, Client } from '@/lib/types'
import { calculateMonthlyTotals } from '@/lib/helpers'
import { getDateRange } from '@/lib/date/dateRange'
import { TimeRange } from '../_domain/dashboard.types'

export function useEarningsTrend(
  entries: WorkEntry[],
  clients: Client[],
  eurRate: number,
  range: TimeRange
): number | null {
  return useMemo(() => {
    const currentRange = getDateRange(range)

    if (!currentRange.from || !currentRange.to) return null

    const prevRange = {
      from: new Date(currentRange.from),
      to: new Date(currentRange.to),
    }

    prevRange.from.setMonth(prevRange.from.getMonth() - 1)
    prevRange.to.setMonth(prevRange.to.getMonth() - 1)

    const current = entries.filter((e) => {
      const d = new Date(e.date)
      return d >= currentRange.from! && d <= currentRange.to!
    })

    const prev = entries.filter((e) => {
      const d = new Date(e.date)
      return d >= prevRange.from && d <= prevRange.to
    })

    const currentTotals = calculateMonthlyTotals(
      current,
      clients,
      eurRate
    )

    const prevTotals = calculateMonthlyTotals(
      prev,
      clients,
      eurRate
    )

    if (prevTotals.totalEarningsAllPLN <= 0) return null

    return (
      ((currentTotals.totalEarningsAllPLN -
        prevTotals.totalEarningsAllPLN) /
        prevTotals.totalEarningsAllPLN) *
      100
    )
  }, [entries, clients, eurRate, range])
}