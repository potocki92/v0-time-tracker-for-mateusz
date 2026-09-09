'use client'

import { useMotionValue } from 'framer-motion'

import { formatHours, formatMoney, toMinor } from '@/lib/format'

import {
  DEMO_AUTOMATION_TARGET,
  DEMO_MONTH,
  demoClient,
  type DemoMonth,
} from '../../demo/demo-data'
import { MonthGrid } from '../MonthGrid'
import { Card, Eyebrow, StatTile } from '../ui'

/** Statusy wpisu — komplet z `features/calendar/domain/calendar.constants`. */
const STATUS_LEGEND = [
  { label: 'Pracowałem', color: 'oklch(0.65 0.20 160)' },
  { label: 'Nie pracowałem', color: 'oklch(0.60 0.22 27)' },
  { label: 'Urlop', color: 'oklch(0.60 0.18 310)' },
  { label: 'L4', color: 'oklch(0.75 0.17 80)' },
  { label: 'Dzień wolny', color: 'oklch(0.65 0 0)' },
] as const

/**
 * Kalendarz — replika `features/calendar`: pasek nawigacji miesiaca, karty
 * KPI, siatka dni i legenda statusow. Miesiac jest ten sam, ktory automat
 * wypelnia nizej na stronie.
 */
export function CalendarScreen({ month }: { month: DemoMonth }) {
  // Kalendarz pokazuje miesiac GOTOWY — stala jedynka zamiast krzywej scrolla.
  const done = useMotionValue(1)
  const client = demoClient(DEMO_AUTOMATION_TARGET.clientId)

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="lp-t11 font-semibold text-white">{DEMO_MONTH.label}</span>
          <span className="flex gap-0.5">
            <span className="flex size-4 items-center justify-center rounded border border-[var(--lp-hair-2)] lp-t8 text-zinc-400">
              ‹
            </span>
            <span className="flex size-4 items-center justify-center rounded border border-[var(--lp-hair-2)] lp-t8 text-zinc-400">
              ›
            </span>
          </span>
        </div>
        <div className="flex gap-0.5 rounded-md border border-[var(--lp-hair-2)] p-0.5">
          {['Siatka', 'Lista'].map((view, index) => (
            <span
              key={view}
              className={`rounded px-1.5 py-0.5 lp-t8 ${
                index === 0 ? 'bg-white/10 text-white' : 'text-zinc-400'
              }`}
            >
              {view}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Godziny" value={formatHours(month.totalHours)} meta={DEMO_MONTH.label} />
        <StatTile label="Dni robocze" value={String(month.workedDays)} meta="z wpisem" />
        <StatTile
          label="Zarobki"
          value={formatMoney(toMinor(month.earningsEur), 'EUR')}
          meta={client.name}
          accent
        />
        <StatTile label="Seria" value="6 dni" meta="z rzędu" />
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1">
          <MonthGrid
            days={month.days}
            progress={done}
            clientColor={client.color}
            today={8}
            fill
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-[var(--lp-hair)] pt-2">
          <Eyebrow>Statusy</Eyebrow>
          {STATUS_LEGEND.map((status) => (
            <span key={status.label} className="flex items-center gap-1 lp-t8 text-zinc-400">
              <span className="size-1.5 rounded-full" style={{ background: status.color }} />
              {status.label}
            </span>
          ))}
        </div>
      </Card>
    </div>
  )
}
