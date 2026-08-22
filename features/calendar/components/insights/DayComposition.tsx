'use client'

import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import { Card, CardContent } from '@/components/ui/card'
import type { DayBreakdown } from '@/lib/metrics/types'

interface Props {
  days: DayBreakdown
}

const SEGMENTS: Array<{
  key: keyof Omit<DayBreakdown, 'totalDays'>
  label: string
  color: string
}> = [
  { key: 'worked', label: 'Pracowane', color: 'bg-emerald-500' },
  { key: 'vacation', label: 'Urlop', color: 'bg-violet-500' },
  { key: 'sick', label: 'L4', color: 'bg-amber-500' },
  { key: 'dayOff', label: 'Wolne', color: 'bg-slate-400' },
  { key: 'weekendIdle', label: 'Weekend', color: 'bg-muted-foreground/40' },
  { key: 'weekdayIdle', label: 'Bez wpisu', color: 'bg-surface-3' },
]

/**
 * Kubełki są rozłączne, więc pasek zawsze wypełnia się dokładnie w 100%.
 * Wcześniej weekend z wpisem liczył się dwa razy i „35 dni" wychodziło
 * w 31-dniowym sierpniu.
 */
export function DayComposition({ days }: Props) {
  const { totalDays } = days
  const segments = SEGMENTS.map((seg) => ({
    ...seg,
    value: days[seg.key],
    percent: totalDays > 0 ? (days[seg.key] / totalDays) * 100 : 0,
  }))

  const summary = `${totalDays} dni: ${segments
    .map((s) => `${s.value} ${s.label.toLowerCase()}`)
    .join(', ')}`

  return (
    <Card className="rounded-lg border-hairline bg-surface-1 py-0 shadow-none">
      <CardContent className="p-4 sm:p-5">
        <header className="flex items-center justify-between">
          <SectionEyebrow as="h3">Struktura dni</SectionEyebrow>
          <span className="text-2xs font-medium text-zinc-400 tabular-nums">
            {totalDays} dni
          </span>
        </header>

        <div
          className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-surface-3"
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
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${seg.color}`}
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
