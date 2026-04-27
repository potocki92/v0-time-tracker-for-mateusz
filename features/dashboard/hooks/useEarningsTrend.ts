import { useMemo } from 'react'
import type { WorkEntry, Client } from '@/lib/types'
import { calculateMonthlyTotals } from '@/lib/finance/totals'
import { useEffectiveEurRate } from './usePreferencesStore'

export type EarningsTrendData = {
  /** Procentowa zmiana (null jeśli brak danych z poprzedniego okresu) */
  percent: number | null
  /** Suma zarobków w bieżącym okresie (PLN) */
  currentTotal: number
  /** Suma zarobków w poprzednim okresie (PLN) */
  prevTotal: number
  /** Różnica bezwzględna w PLN (current - prev) */
  diff: number
}

export function useEarningsTrend(
  currentEntries: WorkEntry[],
  prevEntries: WorkEntry[],
  clients: Client[],
): EarningsTrendData {
  const eurRate = useEffectiveEurRate()

  return useMemo(() => {
    const current = calculateMonthlyTotals(currentEntries, clients, eurRate)
    const prev    = calculateMonthlyTotals(prevEntries,    clients, eurRate)

    const currentTotal = current.totalEarningsAllPLN
    const prevTotal    = prev.totalEarningsAllPLN
    const diff         = currentTotal - prevTotal

    const percent = prevTotal > 0
      ? (diff / prevTotal) * 100
      : null

    return { percent, currentTotal, prevTotal, diff }
  }, [currentEntries, prevEntries, clients, eurRate])
}
