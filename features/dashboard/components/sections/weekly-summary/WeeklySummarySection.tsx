'use client'

import { useMemo, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useDashboardData } from '../../../hooks'
import { buildWeeklySummary, type ContractorBlock } from '../../../lib/weekly-summary'
import { getWeekStart } from '@/lib/date/week'
import { WeeklySummaryModal } from './WeeklySummaryModal'
import { formatDate, formatHours, formatRate, formatTotals } from './presentation'

/**
 * Kafel skrótu przepracowanego tygodnia (dla księgowej).
 * Pokazuje wprost dane bieżącego tygodnia (KW, dni, godziny, stawka, kwota)
 * per kontrahent. Przycisk „Otwórz" otwiera modal z pełnym raportem
 * (druk/PDF, kopiowanie, nawigacja ◀/▶ po poprzednich tygodniach).
 */
export function WeeklySummarySection() {
  const { data } = useDashboardData()
  const [open, setOpen] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0) // 0 = bieżący tydzień, ujemne = wstecz

  const weekStart = useMemo(() => {
    const base = getWeekStart(new Date())
    base.setDate(base.getDate() + weekOffset * 7)
    return base
  }, [weekOffset])

  const summary = useMemo(
    () => buildWeeklySummary(data.workEntries, data.clients, weekStart, undefined, data.projects),
    [data.workEntries, data.clients, data.projects, weekStart],
  )

  return (
    <section
      aria-label="Podsumowanie tygodnia"
      className="rounded-lg border border-hairline bg-surface-1"
    >
      <header className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Podsumowanie tygodnia
            </p>
            <span className="rounded-md border border-hairline bg-surface-2 px-2 py-0.5 text-2xs text-zinc-300">
              KW {summary.weekNumber}/{summary.weekYear}
            </span>
          </div>
          <p className="mt-0.5 truncate text-2xs text-zinc-400">
            dla księgowej · {summary.rangeLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium text-zinc-300 transition hover:bg-surface-3 hover:text-white"
        >
          Otwórz
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </button>
      </header>

      {summary.isEmpty ? (
        <div className="px-4 py-6 text-center text-sm text-zinc-400">
          Brak przepracowanych dni w tym tygodniu.
        </div>
      ) : (
        <ul role="list" className="divide-y divide-hairline">
          {summary.contractors.map((block) => (
            <ContractorRow key={block.clientId ?? '__unassigned__'} block={block} />
          ))}
        </ul>
      )}

      <WeeklySummaryModal
        open={open}
        onOpenChange={setOpen}
        summary={summary}
        onPrevWeek={() => setWeekOffset((o) => o - 1)}
        onNextWeek={() => setWeekOffset((o) => Math.min(0, o + 1))}
        canGoNext={weekOffset < 0}
      />
    </section>
  )
}

function ContractorRow({ block }: { block: ContractorBlock }) {
  return (
    <li className="px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="truncate text-xs font-semibold text-white">{block.clientName}</p>
        <p className="shrink-0 text-xs tabular-nums text-zinc-300">{formatTotals(block)}</p>
      </div>
      <p className="mt-0.5 truncate text-2xs text-zinc-400">
        {formatDate(block.workedFrom)} – {formatDate(block.workedTo)} ({block.workedDaysCount} dni)
        {' · '}
        {formatHours(block.totalHours)}
        {' · '}
        {block.rates.map(formatRate).join(', ')}
      </p>
    </li>
  )
}
