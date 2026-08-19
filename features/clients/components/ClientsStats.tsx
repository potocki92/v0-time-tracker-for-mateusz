'use client'

import { useMemo } from 'react'
import { Banknote, Clock, Trophy, Users, type LucideIcon } from 'lucide-react'
import { useEffectiveEurRate } from '@/features/dashboard'
import { calculateEarnings } from '@/lib/finance/earnings'
import { formatCurrency } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import type { WorkEntry } from '@/lib/types'
import { deriveActivity } from '../domain/clients.selectors'
import type { ClientWithStats } from '../domain/clients.types'
import { LINEAR } from './clients.tokens'

type Props = {
  clients: ClientWithStats[]
  workEntries: WorkEntry[]
}

/**
 * Kafelki KPI odpowiadają na pytanie „jak idzie robota", a nie „jak klienci są
 * poszufladkowani". Poprzednia wersja pokazywała typ rozliczenia i rozkład
 * walut — fakty prawdziwe, ale nikomu niepotrzebne codziennie.
 */
export function ClientsStats({ clients, workEntries }: Props) {
  const eurRate = useEffectiveEurRate()

  const stats = useMemo(() => {
    const now = new Date()
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const byId = new Map(clients.map((c) => [c.id, c]))

    let monthHours = 0
    let monthDays = 0
    let monthPLN = 0
    let monthEUR = 0

    // Jeden przebieg po wpisach zamiast selectClientMonthStats per klient —
    // tamto skanowałoby całą listę wpisów tyle razy, ilu jest klientów.
    for (const entry of workEntries) {
      if (entry.status !== 'worked') continue
      if (!entry.date.startsWith(monthPrefix)) continue
      const client = entry.client_id ? byId.get(entry.client_id) : undefined
      if (!client) continue

      monthHours += entry.hours ?? 0
      monthDays += 1
      const amount = calculateEarnings(entry, client, 1).amount
      if (client.currency === 'EUR') monthEUR += amount
      else monthPLN += amount
    }

    let active = 0
    let dormant = 0
    for (const c of clients) {
      const activity = deriveActivity(c)
      if (activity === 'active') active += 1
      else if (activity === 'dormant') dormant += 1
    }

    // „Największy przychód" liczymy w walucie klienta przeliczonej na PLN —
    // inaczej klient EUR zawsze wygrywałby z klientem PLN o tej samej wartości.
    const top = clients.reduce<ClientWithStats | null>((best, c) => {
      const value = toPln(c.totalEarningsInClientCurrency, c.currency, eurRate)
      const bestValue = best
        ? toPln(best.totalEarningsInClientCurrency, best.currency, eurRate)
        : -1
      return value > bestValue ? c : best
    }, null)

    return {
      monthHours,
      monthDays,
      monthTotalPLN: monthPLN + monthEUR * eurRate,
      monthEUR,
      active,
      dormant,
      top,
    }
  }, [clients, workEntries, eurRate])

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiTile
        label="Zarobek (mies.)"
        value={formatCurrency(stats.monthTotalPLN, 'PLN')}
        icon={Banknote}
        meta={stats.monthEUR > 0 ? `w tym ${formatCurrency(stats.monthEUR, 'EUR')}` : undefined}
      />
      <KpiTile
        label="Godziny (mies.)"
        value={stats.monthHours > 0 ? `${formatHours(stats.monthHours)} h` : '0 h'}
        icon={Clock}
        meta={stats.monthDays > 0 ? `${stats.monthDays} ${pluralizeDays(stats.monthDays)} roboczych` : 'Brak wpisów'}
      />
      <KpiTile
        label="Aktywni"
        value={`${stats.active} / ${clients.length}`}
        icon={Users}
        meta={stats.dormant > 0 ? `${stats.dormant} uśpionych` : 'Wszyscy w grze'}
      />
      <KpiTile
        label="Top przychód"
        value={stats.top?.name ?? '—'}
        icon={Trophy}
        meta={
          stats.top && stats.top.totalEarningsInClientCurrency > 0
            ? formatCurrency(stats.top.totalEarningsInClientCurrency, stats.top.currency)
            : undefined
        }
        compact
      />
    </div>
  )
}

function KpiTile({
  label,
  value,
  icon: Icon,
  meta,
  compact,
}: {
  label: string
  value: string
  icon: LucideIcon
  meta?: string
  /** Nazwa klienta zamiast liczby — mniejszy stopień, żeby się mieściła. */
  compact?: boolean
}) {
  return (
    <div className={cn('rounded-xl border p-3.5 sm:p-4', LINEAR.border, LINEAR.surface)}>
      <div className="flex items-start justify-between gap-2">
        {/* min-h na dwie linie — inaczej kafelek z zawiniętą etykietą jest
            wyższy od sąsiadów i siatka się rozjeżdża. */}
        <p className={cn(LINEAR.eyebrow, 'min-h-[2.4em] leading-[1.2]')}>{label}</p>
        <span
          className={cn('shrink-0 rounded-md border p-1 text-zinc-300', LINEAR.border, LINEAR.surfaceElevated)}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
      {/* Stały rozmiar zamiast płynnego `text-2xl` (clamp w globals.css),
          przez który kwoty ucinały się w dwukolumnowej siatce na telefonie. */}
      <p
        className={cn(
          'mt-2 truncate font-semibold leading-none tracking-tight text-white',
          compact
            ? 'text-sm leading-snug sm:text-base'
            : 'text-2xl tabular-nums sm:text-3xl',
        )}
      >
        {value}
      </p>
      {meta && <p className="mt-2 truncate text-2xs text-zinc-400 sm:text-xs">{meta}</p>}
    </div>
  )
}

function toPln(amount: number, currency: 'PLN' | 'EUR', eurRate: number): number {
  return currency === 'EUR' ? amount * eurRate : amount
}

function formatHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace('.', ',')
}

function pluralizeDays(count: number): string {
  return count === 1 ? 'dzień' : 'dni'
}
