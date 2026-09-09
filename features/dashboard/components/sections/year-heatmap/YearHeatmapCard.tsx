'use client'

import { useEffect, useMemo, useRef } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { HEATMAP_LEVELS } from '@/components/ui/tokens'
import type { AppFormat } from '@/lib/format'
import { useFormat } from '@/lib/format/client'
import { cn } from '@/lib/utils'
import type { WorkEntry } from '@/lib/types'
import { buildHeatmap, HEATMAP_WEEKS } from './heatmap'

type Props = {
  /** Wpisy z CALEJ historii, nie z zakresu — siatka ma wlasne okno tygodni. */
  entries: WorkEntry[]
}

const DAY_LABELS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']
/** Widoczne są co drugie — reszta zostaje dla czytnika ekranu. */
const VISIBLE_DAY_LABELS = new Set([0, 2, 4])

function formatDay(fmt: AppFormat, iso: string): string {
  return `${fmt.weekday(iso, 'short')}, ${fmt.date(iso, 'dayMonth')}`
}

/**
 * Siatka roczna w ukladzie GitHuba. Do wydania „hierarchia Pulpitu" byla
 * doklejona do karty „Godziny" — czyli w pasie nad zagieciem, montowana
 * zawsze, choc odpowiada na pytanie zadawane raz na kwartal. Teraz to
 * osobna sekcja tier `archive`: wlasny chunk, montowana leniwie.
 */
export function YearHeatmapCard({ entries }: Props) {
  const fmt = useFormat()
  const heatmap = useMemo(() => buildHeatmap(fmt, entries), [fmt, entries])

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
      aria-label="Rok w godzinach"
      className="rounded-lg border border-hairline bg-surface-1 p-4"
    >
      <div className="min-w-0">
        {/* Jeden `role="img"` na całą siatkę, nie 364 osobne: czytnik ekranu
            czytał wcześniej każdą komórkę z osobna. Treść dla SR niesie
            tabela `sr-only` niżej — ten sam wzorzec, co w
            `features/calendar/components/insights/HoursPerWeekChart.tsx`. */}
        <div ref={scrollRef} className="overflow-x-auto pb-1">
          <div
            role="img"
            aria-label={`Aktywność z ostatnich ${HEATMAP_WEEKS} tygodni: ${fmt.count(
              heatmap.activeDays,
              ['dzień', 'dni', 'dni'],
            )} z wpisami, łącznie ${fmt.hours(heatmap.totalHours)}`}
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
                              ? `${formatDay(fmt, cell.date)} · jeszcze przed nami`
                              : `${formatDay(fmt, cell.date)} · ${fmt.hours(cell.hours)}`}
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
                <th scope="row">Tydzień od {formatDay(fmt, week.startDate)}</th>
                <td>{fmt.hours(week.totalHours)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-2 flex items-center justify-between gap-3 text-2xs text-zinc-400">
          <span className="tabular-nums">
            {fmt.count(heatmap.activeDays, ['dzień', 'dni', 'dni'])} z wpisami przez
            ostatni rok
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
