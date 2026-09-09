'use client'

import { Check, Flame } from 'lucide-react'
import { NO_DATA } from '@/lib/format'
import { useFormat } from '@/lib/format/client'
type Props = {
  totalHours: number
  /** `null`, gdy nie ma jeszcze zrealizowanego dnia pracy. */
  avgPerDay: number | null
  /** `null` dla zakresu bez sensownej normy („wszystko") — pasek celu znika. */
  targetHours: number | null
  /** 0..n, nieprzycięty — pasek przycinamy dopiero przy rysowaniu. */
  goalProgress: number
  overtime: number
  streakDays: number
}

export function HoursCard({
  totalHours,
  avgPerDay,
  targetHours,
  goalProgress,
  overtime,
  streakDays,
}: Props) {
  const fmt = useFormat()
  const filled = Math.min(100, goalProgress * 100)
  const reached = targetHours !== null && goalProgress >= 1

  return (
    <section
      aria-label="Godziny"
      className="rounded-lg border border-hairline bg-surface-1 p-4"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold tabular-nums leading-[1.15] text-white sm:text-4xl sm:font-bold">
            {fmt.hours(totalHours)}{' '}
            {targetHours !== null && (
              <span className="text-xs font-medium text-zinc-400 sm:text-sm">
                / {fmt.hours(targetHours)}
              </span>
            )}
          </p>
          <p className="mt-1 text-2xs leading-[1.4] text-zinc-400 sm:text-xs">
            Średnio {avgPerDay === null ? NO_DATA : fmt.hours(avgPerDay)}/dzień
            {overtime > 0 && <> · {fmt.hours(overtime, { decimals: 0 })} nadgodzin</>}
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
              <Flame className="h-3 w-3 text-warning-400" aria-hidden />
              Seria {fmt.count(streakDays, ['dzień', 'dni', 'dni'])}
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
            <span>Cel {fmt.hours(targetHours)}</span>
            <span className={reached ? 'font-semibold text-[var(--chart-1)]' : ''}>
              {fmt.hours(totalHours, { decimals: 0 })}
            </span>
          </div>
        </div>
      )}

    </section>
  )
}
