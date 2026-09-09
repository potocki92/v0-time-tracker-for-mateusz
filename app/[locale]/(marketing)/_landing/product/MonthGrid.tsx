'use client'

import { m, type MotionValue } from 'framer-motion'

import { toMinor } from '@/lib/format'
import { useFormat } from '@/lib/format/client'

import { useScrollMap } from '../motion/scene'

import {
  DEMO_MONTH,
  DEMO_RATE_EUR,
  DEMO_WEEKDAY_DATES,
  type DemoDay,
} from '../demo/demo-data'

/**
 * Siatka miesiaca — replika `features/calendar/components/grid`.
 *
 * Zachowane sygnaly z aplikacji: tydzien od poniedzialku, weekend na
 * ciemniejszej powierzchni, lewa krawedz w kolorze statusu „Pracowalem",
 * godziny nad kwota, pasek koloru klienta na dole komorki, podswietlenie
 * dnia dzisiejszego.
 *
 * `progress` steruje pojawianiem sie wpisow (sekcja automatu). Kazda komorka
 * czyta go wlasnym `useTransform`, wiec wypelnianie miesiaca nie wywoluje
 * ani jednego rerenderu Reacta.
 */

interface MonthGridProps {
  days: readonly DemoDay[]
  progress: MotionValue<number>
  /** Zakres postepu, w ktorym wpisy pojawiaja sie po kolei. */
  fillRange?: [number, number]
  clientColor: string
  /** Dzien oznaczony jako „dzisiaj". */
  today?: number
  showAmounts?: boolean
  /** Rozciaga wiersze na cala wysokosc rodzica — jak siatka w aplikacji. */
  fill?: boolean
}

const CELL_SPAN = 0.16

export function MonthGrid({
  days,
  progress,
  fillRange = [0, 0],
  clientColor,
  today,
  showAmounts = true,
  fill = false,
}: MonthGridProps) {
  const fmt = useFormat()
  const filled = days.filter((day) => day.hours !== null)
  const [lo, hi] = fillRange
  const span = Math.max(0, hi - lo)

  return (
    <div className={fill ? 'flex h-full flex-col' : undefined}>
      <div className="mb-1 grid grid-cols-7 gap-1">
        {DEMO_WEEKDAY_DATES.map((date) => (
          <span key={date} className="text-center lp-t8 uppercase tracking-wide text-zinc-400">
            {fmt.weekday(date, 'short')}
          </span>
        ))}
      </div>

      <div
        className={`grid grid-cols-7 gap-1 ${fill ? 'min-h-0 flex-1' : ''}`}
        style={fill ? { gridAutoRows: 'minmax(0, 1fr)' } : undefined}
      >
        {Array.from({ length: DEMO_MONTH.firstWeekdayOffset }).map((_, index) => (
          <span key={`pad-${index}`} aria-hidden />
        ))}

        {days.map((day) => {
          const order = day.hours === null ? 0 : filled.indexOf(day) / Math.max(1, filled.length - 1)
          const start = lo + order * Math.max(0, span - CELL_SPAN)
          return (
            <DayCell
              key={day.day}
              day={day}
              progress={progress}
              window={[start, start + CELL_SPAN]}
              clientColor={clientColor}
              isToday={today === day.day}
              showAmount={showAmounts}
            />
          )
        })}
      </div>
    </div>
  )
}

function DayCell({
  day,
  progress,
  window,
  clientColor,
  isToday,
  showAmount,
}: {
  day: DemoDay
  progress: MotionValue<number>
  window: [number, number]
  clientColor: string
  isToday: boolean
  showAmount: boolean
}) {
  const fmt = useFormat()
  const opacity = useScrollMap(progress, window, [0, 1])
  const scale = useScrollMap(progress, window, [0.86, 1])

  const worked = day.hours !== null
  const weekend = day.weekday >= 5

  return (
    <div
      className={[
        'lp-day',
        weekend && !worked ? 'lp-day-weekend' : '',
        day.inTrip ? 'lp-day-trip' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Skorka wpisu jest osobna warstwa sterowana tym samym postepem, co
          godziny — inaczej miesiac wygladalby na wypelniony, zanim automat
          cokolwiek dopisze. */}
      {worked && <m.span aria-hidden className="lp-day-fill" style={{ opacity }} />}

      <span
        className={
          isToday
            ? 'relative flex size-3.5 items-center justify-center rounded-full bg-[var(--lp-accent)] lp-t8 font-semibold text-black'
            : 'relative lp-t8 font-semibold leading-none text-zinc-400'
        }
      >
        {day.day}
      </span>

      {worked && (
        <m.span
          className="relative mt-auto block min-w-0"
          style={{ opacity, scale }}
        >
          <span className="block truncate lp-t9 font-bold leading-tight text-white">
            {fmt.hours(day.hours)}
          </span>
          {showAmount && (
            <span className="hidden truncate lp-t8 leading-tight text-zinc-400 sm:block">
              {fmt.money(toMinor((day.hours ?? 0) * DEMO_RATE_EUR), 'EUR')}
            </span>
          )}
          <span
            aria-hidden
            className="absolute inset-x-[-4px] bottom-[-4px] h-[2px] opacity-80"
            style={{ background: clientColor }}
          />
        </m.span>
      )}
    </div>
  )
}
