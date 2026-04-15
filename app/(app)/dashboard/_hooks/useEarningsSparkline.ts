// app/(app)/dashboard/_hooks/useEarningsSparkline.ts
import { useMemo } from 'react'
import type { WorkEntry, Client } from '@/lib/types'
import { useEffectiveEurRate } from './usePreferencesStore'

export interface SparklinePoint {
  date:  string   // ISO (do sortowania)
  label: string   // Human-readable (tooltip)
  value: number   // zarobek w PLN
}

/**
 * Agreguje zarobki dzienne na potrzeby sparkline w EarningsCard.
 *
 * Zwraca posortowane chronologicznie punkty — każdy to suma zarobków
 * w PLN za dany dzień (EUR przeliczony po efektywnym kursie).
 */
export function useEarningsSparkline(
  entries: WorkEntry[],
  clients: Client[],
): SparklinePoint[] {
  const eurRate = useEffectiveEurRate()

  return useMemo(() => {
    const clientMap = new Map(clients.map((c) => [c.id, c]))
    const byDate    = new Map<string, number>()

    for (const entry of entries) {
      if (entry.status !== 'worked') continue
      if (!entry.client_id) continue

      const client = clientMap.get(entry.client_id)
      if (!client) continue

      // Kwota netto wg work_type
      let amount = 0
      if (client.work_type === 'hourly') {
        amount = (entry.hours ?? 0) * client.rate
      } else if (client.work_type === 'piecework') {
        const qty =
          entry.quantity ??
          (entry.quantity_from != null && entry.quantity_to != null
            ? entry.quantity_to - entry.quantity_from
            : 0)
        amount = qty * client.rate
      }

      // EUR → PLN jeśli klient rozlicza się w EUR
      const amountPLN = client.currency === 'EUR' ? amount * eurRate : amount

      byDate.set(entry.date, (byDate.get(entry.date) ?? 0) + amountPLN)
    }

    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date,
        label: new Date(date).toLocaleDateString('pl-PL', {
          day:   'numeric',
          month: 'short',
        }),
        value,
      }))
  }, [entries, clients, eurRate])
}
