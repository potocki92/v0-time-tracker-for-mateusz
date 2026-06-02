'use client'

import { useMemo, useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import { useDashboardData } from '../../../hooks'
import { buildWeeklySummary } from '@/features/dashboard/lib/weekly-summary'
import { getWeekStart } from '@/lib/date/week'
import { WeeklySummaryModal } from './WeeklySummaryModal'

/**
 * Wejście do skrótu przepracowanego tygodnia (dla księgowej).
 * Przycisk otwiera modal z danymi kontrahentów, zakresem dni, KW i stawką.
 * Nawigacja ◀/▶ pozwala cofnąć się do poprzednich tygodni (np. raport w poniedziałek
 * za miniony tydzień), bez wchodzenia w przyszłość.
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
    () => buildWeeklySummary(data.workEntries, data.clients, weekStart),
    [data.workEntries, data.clients, weekStart],
  )

  return (
    <section
      aria-label="Podsumowanie tygodnia"
      className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a]"
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[#101010]"
      >
        <span className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#1a1a1a] bg-[#0e0e0e] text-zinc-300">
            <CalendarCheck className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold text-white">
              Podsumowanie tygodnia
            </span>
            <span className="block text-[11.5px] text-zinc-500">
              Skrót dla księgowej — KW, dni, stawka
            </span>
          </span>
        </span>
        <span className="shrink-0 rounded-md border border-[#1a1a1a] bg-[#0e0e0e] px-2 py-1 text-[11px] text-zinc-300">
          Otwórz
        </span>
      </button>

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
