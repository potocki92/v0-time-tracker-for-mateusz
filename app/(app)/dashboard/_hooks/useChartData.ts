import { useMemo } from 'react'
import { getWeekStart } from '@/lib/date/week'
import { calculateEarnings } from '@/lib/helpers'
import { Client, WorkEntry } from '@/lib/types'
import { ChartDataItem, ChartGrouping } from '../_domain/dashboard.types'

export function useChartData(entries: WorkEntry[], clients: Client[], grouping: ChartGrouping, eurRate: number): ChartDataItem[] {
  return useMemo(() => {
    if (!entries.length) return []

    const clientMap = new Map(clients.map((c) => [c.id, c]))
    const grouped = new Map<string, ChartDataItem>()

    for (const entry of entries) {
      const date = new Date(entry.date)

      let key = ''
      let label = ''

      if (grouping === 'daily') {
        key = date.toISOString().slice(0, 10)
        label = date.toLocaleDateString('pl-PL')
      }

      if (grouping === 'weekly') {
        const start = getWeekStart(date)
        key = start.toISOString()
        label = `Tydz ${start.toLocaleDateString('pl-PL')}`
      }

      if (grouping === 'monthly') {
        key = `${date.getFullYear()}-${date.getMonth()}`
        label = date.toLocaleDateString('pl-PL', {
          month: 'short',
          year: 'numeric',
        })
      }

      if (!grouped.has(key)) {
        grouped.set(key, {
          label,
          earningsPLN: 0,
          hours: 0,
        })
      }

      const bucket = grouped.get(key)!

      if (entry.status === 'worked') {
        bucket.hours += entry.hours ?? 0
      }

      const client = entry.client_id
        ? clientMap.get(entry.client_id)
        : undefined

      if (!client) continue
      
      const earnings = calculateEarnings(entry, client, eurRate)

      bucket.earningsPLN += earnings.amountInPLN
    }

    return Array.from(grouped.values())
  }, [entries, clients, grouping, eurRate])
}