import { useMemo } from 'react'
import { WorkEntry, Client } from '@/lib/types'
import { calculateEarnings } from '@/lib/finance/earnings'
import { selectEurRate, usePreferencesStore } from './usePreferencesStore'

export type SparklinePoint = {
  date: string
  label: string
  value: number
}

/**
 * Agreguje dzienne zarobki (PLN) z filtrowanych wpisów.
 * Zwraca posortowaną tablicę punktów do sparkline.
 */
export function useEarningsSparkline(
  entries: WorkEntry[],
  clients: Client[],
): SparklinePoint[] {
  const eurRate = usePreferencesStore(selectEurRate)

  return useMemo(() => {
    const clientMap = new Map(clients.map((c) => [c.id, c]))
    const dailyMap  = new Map<string, number>()

    for (const entry of entries) {
      if (entry.status !== 'worked') continue

      const client = entry.client_id ? clientMap.get(entry.client_id) : undefined
      if (!client) continue

      const { amountInPLN } = calculateEarnings(entry, client, eurRate)
      dailyMap.set(entry.date, (dailyMap.get(entry.date) ?? 0) + amountInPLN)
    }

    return Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date,
        label: new Date(date).toLocaleDateString('pl-PL', {
          day: 'numeric',
          month: 'short',
        }),
        value: Math.round(value * 100) / 100,
      }))
  }, [entries, clients, eurRate])
}
