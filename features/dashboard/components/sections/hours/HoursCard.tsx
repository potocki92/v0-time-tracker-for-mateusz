'use client'

import { useMemo } from 'react'
import { Check } from 'lucide-react'
import type { WorkEntry } from '@/lib/types'

type Props = {
  totalHours: number
  totalDays: number
  targetHours: number
  periodLabel: string
  entries: WorkEntry[]
}

type Cell = {
  date: string
  hours: number
  level: 0 | 1 | 2 | 3 | 4
}

const LEVEL_CLASSES: Record<Cell['level'], string> = {
  0: 'bg-[#101410] border border-[#1a1a1a]',
  1: 'bg-emerald-900/70 border border-emerald-900/30',
  2: 'bg-emerald-700 border border-emerald-700/40',
  3: 'bg-emerald-500 border border-emerald-500/40 shadow-[0_0_8px_-2px_rgba(34,197,94,0.5)]',
  4: 'bg-emerald-400 border border-emerald-400/40 shadow-[0_0_12px_-2px_rgba(34,197,94,0.7)]',
}

function levelFromHours(h: number): Cell['level'] {
  if (h <= 0) return 0
  if (h < 2) return 1
  if (h < 5) return 2
  if (h < 8) return 3
  return 4
}

function startOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

const WEEKS = 4
const DAYS = 7

export function HoursCard({
  totalHours,
  totalDays,
  targetHours,
  periodLabel,
  entries,
}: Props) {
  const ratio = targetHours > 0 ? totalHours / targetHours : 0
  const filled = Math.min(100, ratio * 100)
  const reached = ratio >= 1
  const overtime = Math.max(0, totalHours - targetHours)
  const avgPerDay = totalDays > 0 ? totalHours / totalDays : 0

  const grid = useMemo(() => {
    const today = startOfDay(new Date())
    const dayOfWeek = (today.getDay() + 6) % 7 // 0=Mon..6=Sun
    // Anchor grid so today's column is somewhere on screen; align to most recent Sunday.
    const lastSunday = new Date(today)
    lastSunday.setDate(today.getDate() + (6 - dayOfWeek))
    const totalCells = WEEKS * DAYS
    const start = new Date(lastSunday)
    start.setDate(lastSunday.getDate() - (totalCells - 1))

    const map = new Map<string, number>()
    for (const e of entries) {
      if (e.status !== 'worked') continue
      const h = typeof e.hours === 'number' ? e.hours : 0
      map.set(e.date, (map.get(e.date) ?? 0) + h)
    }

    const rows: Cell[][] = []
    for (let r = 0; r < WEEKS; r += 1) {
      const row: Cell[] = []
      for (let c = 0; c < DAYS; c += 1) {
        const d = new Date(start)
        d.setDate(start.getDate() + r * DAYS + c)
        const iso = isoDate(d)
        const hours = map.get(iso) ?? 0
        row.push({ date: iso, hours, level: levelFromHours(hours) })
      }
      rows.push(row)
    }
    return rows
  }, [entries])

  return (
    <section
      aria-label="Godziny"
      className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Godziny · {periodLabel}
          </p>
          <p className="mt-2 text-[26px] font-semibold tabular-nums leading-[1.15] text-white sm:text-[28px] sm:font-bold">
            {totalHours.toFixed(1)}{' '}
            <span className="text-[12.5px] font-medium text-zinc-500 sm:text-sm">
              / {targetHours} h
            </span>
          </p>
          <p className="mt-1 text-[11.5px] leading-[1.4] text-zinc-500 sm:text-xs">
            Średnio {avgPerDay.toFixed(1)} h/dzień
            {overtime > 0 && <> · {overtime.toFixed(0)} h nadgodzin</>}
          </p>
        </div>
        {reached && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
            <Check className="h-3 w-3" aria-hidden />
            Cel osiągnięty
          </span>
        )}
      </header>

      <div className="mt-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#161616]">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{
              width: `${filled}%`,
              boxShadow: '0 0 12px rgba(34,197,94,0.55)',
            }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-zinc-500">
          <span>0</span>
          <span>Cel {targetHours}</span>
          <span className={reached ? 'font-semibold text-emerald-400' : ''}>
            {totalHours.toFixed(0)}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-1.5">
        {grid.map((row, ri) => (
          <div key={ri} className="grid grid-cols-7 gap-1.5">
            {row.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.date} · ${cell.hours.toFixed(1)} h`}
                aria-label={`${cell.date}: ${cell.hours.toFixed(1)} godzin`}
                className={`aspect-square rounded-md ${LEVEL_CLASSES[cell.level]}`}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
