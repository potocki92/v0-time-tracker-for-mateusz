'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, CheckCircle2, Clock, FileWarning, Loader2 } from 'lucide-react'
import { fetchOverallQuartersAction } from '@/features/invoices'
import type { OverallQuarterSummary } from '@/features/invoices/domain'
import { formatCurrency } from '@/lib/helpers'

const QUERY_KEY = ['dashboard-module', 'data', 'quarterly-summary'] as const

function formatHours(hours: number) {
  if (!Number.isFinite(hours) || hours === 0) return '0 h'
  return `${hours.toLocaleString('pl-PL', { maximumFractionDigits: 1 })} h`
}

/**
 * Quarter-by-quarter snapshot for the dashboard. Surfaces the four most recent
 * calendar quarters with worked hours/days, total earnings, and whether an
 * invoice already exists for the period — turning the "did I bill Q3?" question
 * into a one-glance answer.
 */
export function QuarterlySummaryCard() {
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchOverallQuartersAction(4),
    staleTime: 60_000,
  })

  return (
    <section
      aria-label="Kwartały"
      className="rounded-lg border border-hairline bg-surface-1"
    >
      <header className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Kwartały
          </p>
          <span className="rounded-md border border-hairline bg-surface-2 px-2 py-0.5 text-2xs text-zinc-300">
            ostatnie 4
          </span>
        </div>
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium text-zinc-300 transition hover:bg-surface-3 hover:text-white"
        >
          Wystaw fakturę
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </Link>
      </header>

      {error ? (
        <div className="px-4 py-6 text-center text-sm text-red-400">
          Nie udało się załadować kwartałów.
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Ładowanie...
        </div>
      ) : !data || data.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-zinc-400">
          Brak danych do podsumowania.
        </div>
      ) : (
        <ul role="list" className="divide-y divide-hairline">
          {data.map((q) => (
            <QuarterRow key={q.id} quarter={q} />
          ))}
        </ul>
      )}
    </section>
  )
}

function QuarterRow({ quarter: q }: { quarter: OverallQuarterSummary }) {
  const earningsLabel =
    q.earningsEUR > 0 && q.earningsPLN > 0
      ? `${formatCurrency(q.earningsPLN, 'PLN')} · ${formatCurrency(q.earningsEUR, 'EUR')}`
      : q.earningsEUR > 0
        ? formatCurrency(q.earningsEUR, 'EUR')
        : formatCurrency(q.earningsPLN, 'PLN')

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span
        aria-hidden
        className={
          'mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ' +
          (q.invoiced
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
            : q.workedDays > 0
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
              : 'border-hairline bg-surface-2 text-zinc-400')
        }
      >
        {q.invoiced ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : q.workedDays > 0 ? (
          <FileWarning className="h-4 w-4" />
        ) : (
          <Clock className="h-4 w-4" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-xs font-semibold text-white">
            {q.quarter} {q.year}
          </p>
          <p className="shrink-0 text-xs tabular-nums text-zinc-300">
            {earningsLabel}
          </p>
        </div>
        <p className="mt-0.5 truncate text-2xs text-zinc-400">
          {q.workedDays} {q.workedDays === 1 ? 'dzień' : 'dni'} · {formatHours(q.hours)}
          {q.invoiceCount > 0
            ? ` · ${q.invoiceCount} ${q.invoiceCount === 1 ? 'faktura' : 'faktur'}`
            : ''}
        </p>
        {q.invoiced ? (
          <p className="mt-1 inline-flex items-center gap-1 text-2xs font-semibold uppercase tracking-[0.14em] text-emerald-400">
            Wystawiona
          </p>
        ) : q.workedDays > 0 ? (
          <p className="mt-1 inline-flex items-center gap-1 text-2xs font-semibold uppercase tracking-[0.14em] text-amber-300">
            Do wystawienia
          </p>
        ) : (
          <p className="mt-1 inline-flex items-center gap-1 text-2xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Brak pracy
          </p>
        )}
      </div>
    </li>
  )
}
