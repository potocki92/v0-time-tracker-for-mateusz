// useChartData.ts
import { useMemo } from 'react'
import { calculateEarnings } from '@/lib/helpers'
import { Client, WorkEntry, MONTH_NAMES } from '@/lib/types'
import { ChartDataItem, ChartGrouping } from '../_domain/dashboard.types'

function getWeekStart(date: Date): Date {
  const clone = new Date(date)
  const day = clone.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  clone.setDate(clone.getDate() + mondayOffset)
  clone.setHours(0, 0, 0, 0)
  return clone
}

function getWeekLabel(date: Date): string {
  const weekStart = getWeekStart(date)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  return `${weekStart.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}–${weekEnd.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}`
}

type DateRange = { from: Date | null; to: Date | null }

// Dodajemy earningsEUR do typu
type ChartDataItemExtended = ChartDataItem & { earningsEUR: number }

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
    const grouped = new Map<string, ChartDataItemExtended & { sortDate: Date }>()

    const cursor = new Date(dateRange.from)
    cursor.setHours(0, 0, 0, 0)
    const end = new Date(dateRange.to)
    end.setHours(0, 0, 0, 0)

    while (cursor <= end) {
      let key = ''
      let label = ''
      let sortDate = new Date(cursor)

      if (grouping === 'daily') {
        key = cursor.toISOString().slice(0, 10)
        label = cursor.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })
        cursor.setDate(cursor.getDate() + 1)
      } else if (grouping === 'weekly') {
        const ws = getWeekStart(cursor)
        key = ws.toISOString().slice(0, 10)
        label = getWeekLabel(ws)
        sortDate = ws
        cursor.setDate(cursor.getDate() + 7)
      } else {
        const ms = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
        key = `${ms.getFullYear()}-${String(ms.getMonth() + 1).padStart(2, '0')}`
        label = `${MONTH_NAMES[ms.getMonth()].slice(0, 3)} ${ms.getFullYear()}`
        sortDate = ms
        cursor.setMonth(cursor.getMonth() + 1, 1)
      }

      if (!grouped.has(key)) {
        grouped.set(key, { label, earningsPLN: 0, earningsEUR: 0, hours: 0, sortDate })
      }
    }

    for (const entry of entries) {
      const entryDate = new Date(entry.date)
      let key = ''

      if (grouping === 'daily') {
        key = entryDate.toISOString().slice(0, 10)
      } else if (grouping === 'weekly') {
        key = getWeekStart(entryDate).toISOString().slice(0, 10)
      } else {
        key = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`
      }

      const bucket = grouped.get(key)
      if (!bucket) continue

      if (entry.status === 'worked') {
        bucket.hours += entry.hours ?? 0
      }

      const client = entry.client_id ? clientMap.get(entry.client_id) : undefined
      const earnings = calculateEarnings(entry, client, eurRate)
      bucket.earningsPLN += earnings.amountInPLN
      if (earnings.currency === 'EUR') {
        bucket.earningsEUR += earnings.amount
      }
    }

    return Array.from(grouped.values())
      .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
      .map(({ label, earningsPLN, earningsEUR, hours }) => ({
        label,
        earningsPLN: Number(earningsPLN.toFixed(2)),
        earningsEUR: Number(earningsEUR.toFixed(2)),
        hours: Number(hours.toFixed(1)),
      }))
  }, [entries, clients, grouping, eurRate, dateRange])
}
