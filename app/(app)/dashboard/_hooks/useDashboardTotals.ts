import { useMemo } from 'react'
import { calculateTotals } from '@/lib/finance/totals'
import { Client, WorkEntry } from '@/lib/types'
import { selectEurRate, usePreferencesStore } from './usePreferencesStore'

export function useDashboardTotals(
  filteredEntries: WorkEntry[],
  clients: Client[],
) {
  const eurRate = usePreferencesStore(selectEurRate)

  return useMemo(
    () => calculateTotals(filteredEntries, clients, eurRate),
    [filteredEntries, clients, eurRate]
  )
}
