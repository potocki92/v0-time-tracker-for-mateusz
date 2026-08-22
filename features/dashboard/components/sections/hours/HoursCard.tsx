'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Check, Flame } from 'lucide-react'
import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { HEATMAP_LEVELS } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'
import type { WorkEntry } from '@/lib/types'
import { buildHeatmap, HEATMAP_WEEKS } from './heatmap'

type Props = {
  totalHours: number
  /** `null`, gdy nie ma jeszcze zrealizowanego dnia pracy. */
  avgPerDay: number | null
  /** `null` dla zakresu bez sensownej normy („wszystko") — pasek celu znika. */
  targetHours: number | null
  /** 0..n, nieprzycięty — pasek przycinamy dopiero przy rysowaniu. */
  goalProgress: number
  overtime: number
  periodLabel: string
  /** Wpisy z CAŁEJ historii, nie z zakresu — heatmapa ma własne okno 13 tygodni. */
  entries: WorkEntry[]
  streakDays: number
}

const DAY_LABELS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']
/** Widoczne są co drugie — reszta zostaje dla czytnika ekranu. */
const VISIBLE_DAY_LABELS = new Set([0, 2, 4])

const dayFormatter = new Intl.DateTimeFormat('pl-PL', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

function formatDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return dayFormatter.format(new Date(y, m - 1, d))
}

export function HoursCard({
  totalHours,
  avgPerDay,
  targetHours,
  goalProgress,
  overtime,
  periodLabel,
  entries,
  streakDays,
}: Props) {
  const filled = Math.min(100, goalProgress * 100)
  const reached = targetHours !== null && goalProgress >= 1

  const heatmap = useMemo(() => buildHeatmap(entries), [entries])

  // Siatka roczna jest szersza niz karta na waskich ekranach, a interesujacy
  // jest jej PRAWY koniec — biezacy tydzien. Bez tego telefon pokazywalby
  // sprzed roku.
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  return (
    <section
      aria-label="Godziny"
      className="rounded-lg border border-hairline bg-surface-1 p-4"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <SectionEyebrow>Godziny · {periodLabel}</SectionEyebrow>
          <p className="mt-2 text-3xl font-semibold tabular-nums leading-[1.15] text-white sm:text-4xl sm:font-bold">
            {totalHours.toFixed(1)}{' '}
            {targetHours !== null && (
              <span className="text-xs font-medium text-zinc-400 sm:text-sm">
                / {targetHours} h
              </span>
            )}
          </p>
          <p className="mt-1 text-2xs leading-[1.4] text-zinc-400 sm:text-xs">
            Średnio {avgPerDay === null ? '—' : avgPerDay.toFixed(1)} h/dzień
            {overtime > 0 && <> · {overtime.toFixed(0)} h nadgodzin</>}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {reached && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--chart-1)]/10 px-2 py-0.5 text-2xs font-semibold text-[var(--chart-1)] ring-1 ring-[var(--chart-1)]/30">
              <Check className="h-3 w-3" aria-hidden />
              Cel osiągnięty
            </span>
          )}
          {streakDays > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-2xs font-medium text-zinc-300 ring-1 ring-hairline"
              title="Dni robocze z rzędu z wpisem"
            >
              <Flame className="h-3 w-3 text-amber-400" aria-hidden />
              Seria {streakDays} {streakDays === 1 ? 'dzień' : 'dni'}
            </span>
          )}
        </div>
      </header>

      {targetHours !== null && (
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full transition-[width]"
              style={{
                width: `${filled}%`,
                background: 'var(--chart-1)',
              }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-2xs tabular-nums text-zinc-400">
            <span>0</span>
            <span>Cel {targetHours}</span>
            <span className={reached ? 'font-semibold text-[var(--chart-1)]' : ''}>
              {totalHours.toFixed(0)}
            </span>
          </div>
        </div>
      )}

      <div className="mt-5 min-w-0">
        {/* Jeden `role="img"` na całą siatkę, nie 364 osobne: czytnik ekranu
            czytał wcześniej każdą komórkę z osobna. Treść dla SR niesie
            tabela `sr-only` niżej — ten sam wzorzec, co w
            `features/calendar/components/insights/HoursPerWeekChart.tsx`. */}
        <div ref={scrollRef} className="overflow-x-auto pb-1">
          <div
            role="img"
            aria-label={`Aktywność z ostatnich ${HEATMAP_WEEKS} tygodni: ${heatmap.activeDays} dni z wpisami, łącznie ${heatmap.totalHours.toFixed(1)} godzin`}
            className="flex w-fit gap-2"
          >
            <div
              aria-hidden
              className="flex shrink-0 flex-col gap-[3px] pt-4 text-2xs text-zinc-500"
            >
              {DAY_LABELS.map((label, i) => (
                <span key={label} className="flex h-[13px] items-center leading-none">
                  {VISIBLE_DAY_LABELS.has(i) ? label : ''}
                </span>
              ))}
            </div>

            <TooltipProvider delayDuration={80}>
              <div className="flex flex-col gap-1">
                {/* Rząd etykiet miesięcy MUSI mieć własną wysokość: etykiety są
                    pozycjonowane absolutnie (są szersze niż kolumna tygodnia),
                    więc bez `h-3` rząd zwijał się do zera i napisy lądowały na
                    pierwszym rzędzie komórek. */}
                <div aria-hidden className="flex h-3 gap-[3px] text-2xs leading-3 text-zinc-500">
                  {heatmap.weeks.map((week) => (
                    <span key={week.startDate} className="relative block w-[13px]">
                      {week.monthLabel && (
                        <span className="absolute left-0 top-0 whitespace-nowrap">
                          {week.monthLabel}
                        </span>
                      )}
                    </span>
                  ))}
                </div>

                <div className="flex gap-[3px]">
                  {heatmap.weeks.map((week) => (
                    <div key={week.startDate} className="flex flex-col gap-[3px]">
                      {week.days.map((cell) => (
                        <Tooltip key={cell.date}>
                          <TooltipTrigger asChild>
                            <div
                              aria-hidden
                              className={cn(
                                'h-[13px] w-[13px] rounded-[3px] transition-transform hover:scale-125',
                                cell.isFuture && 'border border-dashed border-hairline',
                                cell.isToday && 'ring-1 ring-[var(--chart-1)]/60',
                              )}
                              style={
                                cell.isFuture
                                  ? undefined
                                  : { background: HEATMAP_LEVELS[cell.level] }
                              }
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={4}>
                            {cell.isFuture
                              ? `${formatDay(cell.date)} · jeszcze przed nami`
                              : `${formatDay(cell.date)} · ${cell.hours.toFixed(1)} h`}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </TooltipProvider>
          </div>
        </div>

        <table className="sr-only">
          <caption>Godziny w tygodniach — ostatnie {HEATMAP_WEEKS} tygodni</caption>
          <tbody>
            {heatmap.weeks.map((week) => (
              <tr key={week.startDate}>
                <th scope="row">Tydzień od {formatDay(week.startDate)}</th>
                <td>{week.totalHours.toFixed(1)} h</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-2 flex items-center justify-between gap-3 text-2xs text-zinc-400">
          <span className="tabular-nums">
            {heatmap.activeDays} dni z wpisami przez ostatni rok
          </span>
          <span aria-hidden className="flex items-center gap-1">
            Mniej
            {HEATMAP_LEVELS.map((color, i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 rounded-[2px]"
                style={{ background: color }}
              />
            ))}
            Więcej
          </span>
        </div>
      </div>

    </section>
  )
}
