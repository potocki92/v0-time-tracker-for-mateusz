import { useMemo } from 'react'
import { calculateTotals } from '@/lib/finance/totals'
import { Client, WorkEntry } from '@/lib/types'

export function useDashboardTotals(
  filteredEntries: WorkEntry[],
  clients: Client[],
  eurRate: number,
) {
  return useMemo(
    () => calculateTotals(filteredEntries, clients, eurRate),
    [filteredEntries, clients, eurRate]
  )
}
