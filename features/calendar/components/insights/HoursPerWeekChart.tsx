'use client'

import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import { useMemo } from 'react'
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { WeeklyHoursBar } from '../../domain/calendar.types'

interface Props {
  weekly: WeeklyHoursBar[]
  totalHours: number
  avgHours: number
  peak: WeeklyHoursBar | null
  monthName: string
}

/**
 * Wykres słupkowy "Hours per week". Bieżący tydzień podświetlony primary,
 * pozostałe tygodnie w odcieniu primary/35. Pod wykresem skompresowane
 * statystyki (Total / Avg/day / Peak).
 */
export function HoursPerWeekChart({
  weekly,
  totalHours,
  avgHours,
  peak,
  monthName,
}: Props) {
  const data = useMemo(
    () => weekly.map((w) => ({ ...w, value: w.hours })),
    [weekly],
  )

  const peakLabel = peak ? `${peak.hours} h · ${peak.label}` : '—'

  // Dla a11y dorzucamy tekstowe podsumowanie poza obrazkiem.
  const summary = `Łącznie ${totalHours} godzin w ${monthName}, średnio ${avgHours} godzin tygodniowo.`

  return (
    <Card className="rounded-lg border-hairline bg-surface-1 py-0 shadow-none">
      <CardContent className="p-4 sm:p-5">
        <header className="flex items-center justify-between gap-2">
          <SectionEyebrow as="h3">Godziny tygodniowo</SectionEyebrow>
          <span className="rounded-full border border-hairline bg-surface-2 px-2 py-0.5 text-2xs font-medium capitalize text-zinc-400">
            {monthName}
          </span>
        </header>

        <div
          className="mt-4 h-32 w-full sm:h-36"
          role="img"
          aria-label={summary}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 6, right: 4, left: -28, bottom: 0 }}
              barCategoryGap={8}
            >
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#71717a' }}
                interval={0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#71717a' }}
                width={28}
                hide
              />
              <Bar
                dataKey="value"
                radius={[6, 6, 2, 2]}
                isAnimationActive
                animationDuration={650}
                animationEasing="ease-out"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={entry.isCurrent ? '#22c55e' : 'rgba(34,197,94,0.35)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-hairline pt-3 text-2xs sm:gap-3">
          <Stat label="Łącznie" value={`${totalHours.toFixed(1)} h`} />
          <Stat label="Śr./tydzień" value={`${avgHours} h`} />
          <Stat label="Szczyt" value={peakLabel} />
        </div>

        <p className="sr-only">
          {data
            .map((d) => `${d.label}: ${d.hours} godzin`)
            .join(', ')}
        </p>
      </CardContent>
    </Card>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-2xs uppercase tracking-wider text-zinc-400">{label}</div>
      <div
        className={cn(
          'truncate text-xs font-semibold tabular-nums',
          highlight ? 'text-emerald-400' : 'text-white',
        )}
      >
        {value}
      </div>
    </div>
  )
}
