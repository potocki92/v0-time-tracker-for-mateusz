'use client'

import { useMemo, useState } from 'react'
import { ArrowUpRight, FileText } from 'lucide-react'
import { useDashboardSlice } from '../../../hooks/useDashboardSlice'
import {
  selectClients,
  selectProjects,
  selectWorkEntries,
} from '../../../hooks/dashboardSelectors'
import { buildWeeklySummary, type ContractorBlock } from '../../../lib/weekly-summary'
import { getWeekStart } from '@/lib/date/week'
import { DASHBOARD_SURFACE } from '@/components/ui/tokens'
import { DashboardSectionCard } from '@/components/workspace/card/dashboard-section-card'
import { WeeklySummaryModal } from './WeeklySummaryModal'
import type { AppFormat } from '@/lib/format'
import { useFormat } from '@/lib/format/client'
import { formatDate, formatHours, formatRate, formatTotals } from './presentation'
import { cn } from '@/lib/utils'

/**
 * Kafel skrótu przepracowanego tygodnia (dla księgowej).
 * Pokazuje wprost dane bieżącego tygodnia (KW, dni, godziny, stawka, kwota)
 * per kontrahent. Przycisk „Otwórz" otwiera modal z pełnym raportem
 * (druk/PDF, kopiowanie, nawigacja ◀/▶ po poprzednich tygodniach).
 */
export function WeeklySummarySection() {
  const fmt = useFormat()
  const workEntries = useDashboardSlice(selectWorkEntries)
  const clients = useDashboardSlice(selectClients)
  const projects = useDashboardSlice(selectProjects)
  const [open, setOpen] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0) // 0 = bieżący tydzień, ujemne = wstecz

  const weekStart = useMemo(() => {
    const base = getWeekStart(new Date())
    base.setDate(base.getDate() + weekOffset * 7)
    return base
  }, [weekOffset])

  const summary = useMemo(
    () => buildWeeklySummary(fmt, workEntries, clients, weekStart, undefined, projects),
    [fmt, workEntries, clients, projects, weekStart],
  )

  return (
    <DashboardSectionCard padded={false}>
      <div className="flex items-start justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-lg font-semibold leading-tight tabular-nums text-white">
            KW {summary.weekNumber}/{summary.weekYear}
          </p>
          <p className="mt-0.5 truncate text-xs text-zinc-400">
            dla księgowej · {summary.rangeLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-hairline bg-surface-2 px-3 text-2xs font-medium text-zinc-300 transition hover:border-hairline-strong hover:bg-surface-3 hover:text-white"
        >
          Otwórz
          <ArrowUpRight className="size-3.5" aria-hidden />
        </button>
      </div>

      {summary.isEmpty ? (
        // Pusty stan jako zagniezdzony panel, a nie napis na pustej karcie —
        // inaczej „brak danych" wyglada jak bledny render.
        <div className="px-4 pb-4">
          <div
            className={cn(
              DASHBOARD_SURFACE.nested,
              'flex items-center gap-3 px-3 py-3 text-xs text-zinc-400',
            )}
          >
            <span
              aria-hidden
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-zinc-400"
            >
              <FileText className="size-4" />
            </span>
            Brak przepracowanych dni w tym tygodniu.
          </div>
        </div>
      ) : (
        <ul role="list" className="divide-y divide-hairline border-t border-hairline">
          {summary.contractors.map((block) => (
            <ContractorRow fmt={fmt} key={block.clientId ?? '__unassigned__'} block={block} />
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
    </DashboardSectionCard>
  )
}

function ContractorRow({ fmt, block }: { fmt: AppFormat; block: ContractorBlock }) {
  return (
    <li className="px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="truncate text-xs font-semibold text-white">{block.clientName}</p>
        <p className="shrink-0 text-xs tabular-nums text-zinc-300">{formatTotals(fmt, block)}</p>
      </div>
      <p className="mt-0.5 truncate text-2xs text-zinc-400">
        {formatDate(fmt, block.workedFrom)} – {formatDate(fmt, block.workedTo)} ({block.workedDaysCount} dni)
        {' · '}
        {formatHours(fmt, block.totalHours)}
        {' · '}
        {block.rates.map((rate) => formatRate(fmt, rate)).join(', ')}
      </p>
    </li>
  )
}
