'use client'

import { useMemo } from 'react'
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { MONTH_NAMES } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { WeeklyHoursBar } from '../../_domain/calendar.types'

interface Props {
  weekly: WeeklyHoursBar[]
  totalHours: number
  avgHours: number
  peak: { hours: number; date: string } | null
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

  const peakLabel = peak
    ? `${peak.hours}h · ${formatPeakDate(peak.date)}`
    : '—'

  // Dla a11y dorzucamy tekstowe podsumowanie poza obrazkiem.
  const summary = `Łącznie ${totalHours} godzin w ${monthName}, średnio ${avgHours} godzin dziennie.`

  return (
    <Card className="border-border/60 py-0 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <header className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px]">
            Godziny tygodniowo
          </h3>
          <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
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
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                interval={0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
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
                    fill={
                      entry.isCurrent
                        ? 'var(--primary)'
                        : 'color-mix(in oklab, var(--primary) 35%, transparent)'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/50 pt-3 text-[11px] sm:gap-3">
          <Stat label="Łącznie" value={`${totalHours} h`} />
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
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={cn(
          'truncate text-xs font-semibold tabular-nums',
          highlight ? 'text-primary' : 'text-foreground',
        )}
      >
        {value}
      </div>
    </div>
  )
}

function formatPeakDate(date: string): string {
  const [, m, d] = date.split('-').map(Number)
  return `${d} ${MONTH_NAMES[m - 1].slice(0, 3).toLowerCase()}`
}
