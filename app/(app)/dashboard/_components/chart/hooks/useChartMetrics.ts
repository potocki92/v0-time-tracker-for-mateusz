import { useMemo } from 'react'
import { calculateEarnings } from '@/lib/finance/earnings'
import { Client, WorkEntry } from '@/lib/types'
import { useFilteredEntries } from '../../../_hooks/useFilteredEntries'
import { useChartData } from '../../../_hooks/useChartData'
import type { Grouping, DateRange } from './useChartState'

export function useChartMetrics(
  workEntries: WorkEntry[],
  clients: Client[],
  eurToPlnRate: number,
  grouping: Grouping,
  dateRange: DateRange,
  prevRange: DateRange,
) {
  // Używamy istniejącego hooka zamiast duplikować logikę
  const filteredEntries = useFilteredEntries(workEntries, dateRange)
  const prevEntries     = useFilteredEntries(workEntries, prevRange)

  const barData     = useChartData(filteredEntries, clients, grouping, eurToPlnRate, dateRange)
  const prevBarData = useChartData(prevEntries,     clients, grouping, eurToPlnRate, prevRange)

  const mergedData = useMemo(() =>
    barData.map((d, i) => ({ ...d, prevHours: prevBarData[i]?.hours ?? 0 })),
    [barData, prevBarData]
  )

  const totalHours = useMemo(
    () => filteredEntries.reduce((s, e) => s + (e.hours ?? 0), 0),
    [filteredEntries]
  )

  const totalEarnings = useMemo(() => {
    const clientMap = new Map(clients.map((c) => [c.id, c]))
    let pln = 0, eur = 0
    for (const entry of filteredEntries) {
      const client = entry.client_id ? clientMap.get(entry.client_id) : undefined
      const e = calculateEarnings(entry, client, eurToPlnRate)
      pln += e.amountInPLN
      eur += e.amountInEUR
    }
    return { pln, eur }
  }, [filteredEntries, clients, eurToPlnRate])

  const avgHours = useMemo(() => {
    const active = mergedData.filter((d) => d.hours > 0)
    if (!active.length) return 0
    return active.reduce((s, d) => s + d.hours, 0) / active.length
  }, [mergedData])

  const trend = useMemo(() => {
    const curr = filteredEntries.reduce((s, e) => s + (e.hours ?? 0), 0)
    const prev = prevEntries.reduce((s, e) => s + (e.hours ?? 0), 0)
    if (!prev) return null
    return ((curr - prev) / prev) * 100
  }, [filteredEntries, prevEntries])

  return { mergedData, totalHours, totalEarnings, avgHours, trend, isEmpty: mergedData.every((d) => d.hours === 0) }
}
