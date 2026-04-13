import { useMemo } from 'react'
import { WorkEntry, Client } from '@/lib/types'
import { calculateMonthlyTotals } from '@/lib/helpers'
import { selectEurRate, usePreferencesStore } from './usePreferencesStore'

export function useEarningsTrend(
  currentEntries: WorkEntry[],
  prevEntries: WorkEntry[],
  clients: Client[],
): number | null {
  const eurRate = usePreferencesStore(selectEurRate)

  return useMemo(() => {
    const current = calculateMonthlyTotals(currentEntries, clients, eurRate)
    const prev    = calculateMonthlyTotals(prevEntries,   clients, eurRate)
    if (prev.totalEarningsAllPLN <= 0) return null
    return ((current.totalEarningsAllPLN - prev.totalEarningsAllPLN) / prev.totalEarningsAllPLN) * 100
  }, [currentEntries, prevEntries, clients, eurRate])
}
