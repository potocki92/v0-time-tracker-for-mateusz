'use client'

import { useMemo } from 'react'
import { calculateEarnings } from '@/lib/finance/earnings'
import { useDashboardData } from '../../_hooks'
import { useFilteredEntries } from '../../_hooks/useFilteredEntries'
import { useDashboardTotals } from '../../_hooks/useDashboardTotal'
import { useEffectiveEurRate } from '../../_hooks/usePreferencesStore'
import { usePeriodLabel } from '../../_hooks/usePeriodLabel'
import { EffectiveRateCard, type ClientRate } from '../linear'
import { useDashboardRange } from './DashboardRangeContext'

const FALLBACK_COLORS = [
  '#f59e0b', // amber
  '#ef4444', // red
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#22c55e', // emerald
  '#ec4899', // pink
]

function periodShort(label: string): string {
  // Take first non-stop word
  const words = label.split(' ')
  return (words[words.length - 1] ?? label).slice(0, 8)
}

export function EffectiveRateSection() {
  const { data } = useDashboardData()
  const { range, dateRange } = useDashboardRange()
  const filtered = useFilteredEntries(data.workEntries, dateRange)
  const totals = useDashboardTotals(filtered, data.clients)
  const eurRate = useEffectiveEurRate()
  const periodLabel = usePeriodLabel(range)

  const { rates, blendedRate } = useMemo(() => {
    const clientMap = new Map(data.clients.map((c) => [c.id, c]))
    type Acc = { hours: number; earnings: number; clientId: string }
    const map = new Map<string, Acc>()

    for (const e of filtered) {
      if (e.status !== 'worked') continue
      if (!e.client_id) continue
      const c = clientMap.get(e.client_id)
      if (!c) continue
      const { amountInPLN } = calculateEarnings(e, c, eurRate)
      const hours = e.hours ?? 0
      const acc = map.get(e.client_id) ?? { hours: 0, earnings: 0, clientId: e.client_id }
      acc.hours += hours
      acc.earnings += amountInPLN
      map.set(e.client_id, acc)
    }

    const totalEarn = totals.totalEarningsAllPLN
    const list: ClientRate[] = Array.from(map.values())
      .filter((r) => r.hours > 0)
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 4)
      .map((r, i) => {
        const c = clientMap.get(r.clientId)
        return {
          clientId: r.clientId,
          name: c?.name ?? 'Client',
          ratePerHour: r.earnings / r.hours,
          currency: 'EUR',
          share: totalEarn > 0 ? r.earnings / totalEarn : 0,
          color: c?.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        }
      })

    const blended = totals.totalHours > 0 ? totals.totalEarningsAllPLN / totals.totalHours : 0
    return { rates: list, blendedRate: blended }
  }, [filtered, data.clients, eurRate, totals])

  return (
    <EffectiveRateCard
      blendedRate={blendedRate}
      currency="EUR"
      clientsCount={rates.length}
      rates={rates}
      periodShort={periodShort(periodLabel)}
    />
  )
}
