'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { DayCompositionBreakdown } from '../../domain/calendar.types'

interface Props {
  composition: DayCompositionBreakdown
}

const SEGMENTS: Array<{
  key: keyof Omit<DayCompositionBreakdown, 'totalDays'>
  label: string
  color: string
  ringColor: string
}> = [
  { key: 'worked', label: 'Pracowane', color: 'bg-emerald-500', ringColor: 'bg-emerald-500' },
  { key: 'pto', label: 'Urlop', color: 'bg-violet-500', ringColor: 'bg-violet-500' },
  { key: 'sick', label: 'L4', color: 'bg-amber-500', ringColor: 'bg-amber-500' },
  { key: 'off', label: 'Wolne', color: 'bg-slate-400', ringColor: 'bg-slate-400' },
  { key: 'weekend', label: 'Weekend', color: 'bg-muted-foreground/40', ringColor: 'bg-muted-foreground/40' },
]

export function DayComposition({ composition }: Props) {
  const { totalDays } = composition
  const segments = SEGMENTS.map((seg) => ({
    ...seg,
    value: composition[seg.key],
    percent: totalDays > 0 ? (composition[seg.key] / totalDays) * 100 : 0,
  }))

  const summary = `${totalDays} dni: ${segments
    .map((s) => `${s.value} ${s.label.toLowerCase()}`)
    .join(', ')}`

  return (
    <Card className="rounded-lg border-[#1a1a1a] bg-[#0a0a0a] py-0 shadow-none">
      <CardContent className="p-4 sm:p-5">
        <header className="flex items-center justify-between">
          <h3 className="text-2xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Struktura dni
          </h3>
          <span className="text-2xs font-medium text-zinc-400 tabular-nums">
            {totalDays} dni
          </span>
        </header>

        <div
          className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-[#161616]"
          role="img"
          aria-label={summary}
        >
          {segments.map(
            (seg) =>
              seg.percent > 0 && (
                <div
                  key={seg.key}
                  className={seg.color}
                  style={{ width: `${seg.percent}%` }}
                  title={`${seg.label}: ${seg.value}`}
                />
              ),
          )}
        </div>

        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
          {segments.map((seg) => (
            <li
              key={seg.key}
              className="flex items-center justify-between gap-2 text-2xs"
            >
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${seg.ringColor}`}
                  aria-hidden
                />
                {seg.label}
              </span>
              <span className="font-semibold tabular-nums text-white">
                {seg.value}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
