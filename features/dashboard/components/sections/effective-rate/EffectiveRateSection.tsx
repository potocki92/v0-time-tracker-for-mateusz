'use client'

import { useMemo } from 'react'
import { useDashboardSlice } from '../../../hooks/useDashboardSlice'
import { selectClients } from '../../../hooks/dashboardSelectors'
import { EffectiveRateCard, type ClientRate } from './EffectiveRateCard'
import { useDashboardDerived } from '../shared/DashboardDerivedContext'

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
 * Stawka efektywna = przychód okna / rozliczalne godziny okna.
 *
 * Poprzednia wersja liczyła wyłącznie klientów rozliczanych w EUR, więc przy
 * kliencie w złotówkach pokazywała „0,00 €/h · 0 klientów" obok kilkunastu
 * tysięcy przychodu. Teraz obie liczby biorą się z `metrics`, czyli z tego
 * samego rachunku co Kalendarz — waluta wynika z ustawień, nie z klienta.
 */
export function EffectiveRateSection() {
  const clients = useDashboardSlice(selectClients)
  const { periodLabel, metrics } = useDashboardDerived()

  const rates = useMemo<ClientRate[]>(() => {
    const clientMap = new Map(clients.map((c) => [c.id, c]))
    return metrics.byClient
      .filter((bucket) => bucket.hours > 0 && bucket.amountMinor > 0)
      .slice(0, 4)
      .map((bucket, i) => {
        const client = bucket.clientId ? clientMap.get(bucket.clientId) : undefined
        return {
          clientId: bucket.clientId ?? '__unassigned',
          name: client?.name ?? 'Bez klienta',
          ratePerHour: bucket.amountMinor / bucket.hours / 100,
          currency: metrics.earnings.currency,
          share: bucket.shareOfMonth,
          color: client?.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        }
      })
  }, [metrics.byClient, metrics.earnings.currency, clients])

  return (
    <EffectiveRateCard
      blendedRate={
        metrics.effectiveRateMinorPerHour === null
          ? null
          : metrics.effectiveRateMinorPerHour / 100
      }
      currency={metrics.earnings.currency}
      clientsCount={rates.length}
      rates={rates}
      periodShort={periodShort(periodLabel)}
    />
  )
}
