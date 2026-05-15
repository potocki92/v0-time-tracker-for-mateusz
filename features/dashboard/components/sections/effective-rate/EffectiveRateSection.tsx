'use client'

import { useMemo } from 'react'
import { fallbackFromClient } from '@/lib/finance/entry-calculations'
import { useDashboardData } from '../../../hooks'
import { useFilteredEntries } from '../../../hooks/useFilteredEntries'
import { usePeriodLabel } from '../../../hooks/usePeriodLabel'
import { EffectiveRateCard, type ClientRate } from './EffectiveRateCard'
import { useDashboardRange } from '../shared/DashboardRangeContext'

const FALLBACK_COLORS = [
  '#f59e0b',
  '#ef4444',
  '#3b82f6',
  '#8b5cf6',
  '#22c55e',
  '#ec4899',
]

function periodShort(label: string): string {
  const words = label.split(' ')
  return (words[words.length - 1] ?? label).slice(0, 8)
}

/**
 * Effective rate — pokazuje wyłącznie BAZOWĄ stawkę godzinową w EUR
 * (bez przeliczania kursem NBP). Klienci, którzy mają stawkę w PLN,
 * są pomijani: dla nich pojęcie "bazowej stawki w EUR" nie istnieje.
 */
export function EffectiveRateSection() {
  const { data } = useDashboardData()
  const { range, dateRange } = useDashboardRange()
  const filtered = useFilteredEntries(data.workEntries, dateRange)
  const periodLabel = usePeriodLabel(range)

  const { rates, blendedRate } = useMemo(() => {
    const clientMap = new Map(data.clients.map((c) => [c.id, c]))
    type Acc = { hours: number; clientId: string }
    const map = new Map<string, Acc>()

    let eurHours = 0
    let eurEarnings = 0

    for (const e of filtered) {
      if (e.status !== 'worked') continue
      if (!e.client_id) continue
      const c = clientMap.get(e.client_id)
      if (!c) continue
      const fb = fallbackFromClient(c)
      if (fb.currency !== 'EUR') continue

      const hours = e.hours ?? 0
      const acc = map.get(e.client_id) ?? { hours: 0, clientId: e.client_id }
      acc.hours += hours
      map.set(e.client_id, acc)

      eurHours += hours
      eurEarnings += hours * fb.rate
    }

    const list: ClientRate[] = Array.from(map.values())
      .filter((r) => r.hours > 0)
      .map((r, i) => {
        const c = clientMap.get(r.clientId)
        const fb = c ? fallbackFromClient(c) : { rate: 0, currency: 'EUR' as const, workType: 'hourly' as const }
        const earnings = r.hours * fb.rate
        return {
          clientId: r.clientId,
          name: c?.name ?? 'Klient',
          ratePerHour: fb.rate,
          currency: 'EUR' as const,
          share: eurEarnings > 0 ? earnings / eurEarnings : 0,
          color: c?.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
          earnings,
        }
      })
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 4)
      .map(({ earnings, ...rest }) => rest)

    const blended = eurHours > 0 ? eurEarnings / eurHours : 0
    return { rates: list, blendedRate: blended }
  }, [filtered, data.clients])

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
