import { useMemo } from 'react'
import { calculateEarnings } from '@/lib/finance/earnings'
import { Client, WorkEntry, MONTH_NAMES } from '@/lib/types'
import { ChartDataItem, ChartGrouping } from '../types/dashboard.types'
import { toDateKey } from '@/lib/date/format'           // ← z @/lib
import { getWeekStart, getWeekLabel } from '@/lib/date/week' // ← z @/lib
import { getQuarterLabel } from '@/lib/date/quarter'

type DateRange = { from: Date | null; to: Date | null }
export type ChartDataItemExtended = ChartDataItem & { earningsEUR: number; date: string }

export function useChartData(
  entries: WorkEntry[],
  clients: Client[],
  grouping: ChartGrouping,
  eurRate: number,
  dateRange: DateRange
): ChartDataItemExtended[] {
  return useMemo(() => {
    if (!entries.length || !dateRange.from || !dateRange.to) return []

    const clientMap = new Map(clients.map((c) => [c.id, c]))
    type GroupedDataItem = ChartDataItem & { earningsEUR: number; sortDate: Date }
    const grouped   = new Map<string, GroupedDataItem>()

    const cursor = new Date(dateRange.from)
    cursor.setHours(0, 0, 0, 0)
    const end = new Date(dateRange.to)
    end.setHours(0, 0, 0, 0)

    while (cursor <= end) {
      let key = '', label = '', sortDate = new Date(cursor)

      if (grouping === 'daily') {
        key   = toDateKey(cursor)
        label = cursor.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })
        cursor.setDate(cursor.getDate() + 1)
      } else if (grouping === 'weekly') {
        const ws = getWeekStart(cursor)
        key      = toDateKey(ws)
        label    = getWeekLabel(ws)
        sortDate = ws
        cursor.setDate(cursor.getDate() + 7)
      } else if (grouping === 'monthly') {
        const ms = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
        key      = `${ms.getFullYear()}-${String(ms.getMonth() + 1).padStart(2, '0')}`
        label    = MONTH_NAMES[ms.getMonth()].slice(0, 3)
        sortDate = ms
        cursor.setMonth(cursor.getMonth() + 1, 1)
      } else {
        const quarterStartMonth = Math.floor(cursor.getMonth() / 3) * 3
        const qs = new Date(cursor.getFullYear(), quarterStartMonth, 1)
        key = `${qs.getFullYear()}-Q${Math.floor(quarterStartMonth / 3) + 1}`
        label = getQuarterLabel(qs)
        sortDate = qs
        cursor.setMonth(cursor.getMonth() + 3, 1)
      }

      if (!grouped.has(key)) {
        grouped.set(key, { label, earningsPLN: 0, earningsEUR: 0, hours: 0, sortDate })
      }
    }

    for (const entry of entries) {
      const d   = new Date(entry.date)
      const key = grouping === 'daily'
        ? toDateKey(d)
        : grouping === 'weekly'
          ? toDateKey(getWeekStart(d))
          : grouping === 'monthly'
            ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            : `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`

      const bucket = grouped.get(key)
      if (!bucket) continue

      if (entry.status === 'worked') bucket.hours += entry.hours ?? 0
      const client   = entry.client_id ? clientMap.get(entry.client_id) : undefined
      const earnings = calculateEarnings(entry, client, eurRate)
      bucket.earningsPLN += earnings.amountInPLN
      bucket.earningsEUR += earnings.amountInEUR
    }

    return Array.from(grouped.values())
      .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
      .map(({ label, earningsPLN, earningsEUR, hours, sortDate }) => ({
        label,
        earningsPLN: Number(earningsPLN.toFixed(2)),
        earningsEUR: Number(earningsEUR.toFixed(2)),
        hours:       Number(hours.toFixed(1)),
        date: sortDate.toISOString(),
      }))
  }, [entries, clients, grouping, eurRate, dateRange])
}
