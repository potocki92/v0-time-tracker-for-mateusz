import { useMemo } from 'react'
import { calculateTotals } from '@/lib/finance/totals'
import type { Client, WorkEntry } from '@/lib/types'
import { useEffectiveEurRate } from './usePreferencesStore'

export function useDashboardTotals(
  filteredEntries: WorkEntry[],
  clients: Client[],
) {
  const eurRate = useEffectiveEurRate()

  return useMemo(
    () => calculateTotals(filteredEntries, clients, eurRate),
    [filteredEntries, clients, eurRate],
  )
}
