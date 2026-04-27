'use client'

import { useMemo } from 'react'
import type { WorkEntry } from '@/lib/types'

type Props = {
  entries: WorkEntry[]
  weeks?: number
}

type Cell = {
  date: string
  hours: number
  level: 0 | 1 | 2 | 3 | 4
}

const LEVEL_CLASSES: Record<Cell['level'], string> = {
  0: 'bg-[#0e0e0e] border border-[#1a1a1a]',
  1: 'bg-emerald-900/60',
  2: 'bg-emerald-700/80',
  3: 'bg-emerald-500',
  4: 'bg-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.55)]',
}

function levelFromHours(hours: number): Cell['level'] {
  if (hours <= 0) return 0
  if (hours < 2) return 1
  if (hours < 4) return 2
  if (hours < 7) return 3
  return 4
}

function startOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const WEEKDAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']

export function HoursHeatmap({ entries, weeks = 13 }: Props) {
  const { columns, totalHours, activeDays } = useMemo(() => {
    const today = startOfDay(new Date())
    // align grid so the rightmost column is the current week (Mon..Sun)
    const dayOfWeek = (today.getDay() + 6) % 7 // 0=Mon..6=Sun
    const lastSunday = new Date(today)
    lastSunday.setDate(today.getDate() + (6 - dayOfWeek))

    const totalDays = weeks * 7
    const start = new Date(lastSunday)
    start.setDate(lastSunday.getDate() - (totalDays - 1))

    const hoursByDate = new Map<string, number>()
    for (const e of entries) {
      if (e.status !== 'worked') continue
      const h = typeof e.hours === 'number' ? e.hours : 0
      hoursByDate.set(e.date, (hoursByDate.get(e.date) ?? 0) + h)
    }

    const cols: Cell[][] = []
    let total = 0
    let active = 0
    for (let w = 0; w < weeks; w += 1) {
      const col: Cell[] = []
      for (let d = 0; d < 7; d += 1) {
        const cur = new Date(start)
        cur.setDate(start.getDate() + w * 7 + d)
        const iso = isoDate(cur)
        const hours = hoursByDate.get(iso) ?? 0
        if (hours > 0) {
          total += hours
          active += 1
        }
        col.push({ date: iso, hours, level: levelFromHours(hours) })
      }
      cols.push(col)
    }

    return { columns: cols, totalHours: total, activeDays: active }
  }, [entries, weeks])

  return (
    <section
      aria-label="Mapa godzin pracy"
      className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:p-5"
    >
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-white">Hours</h2>
          <p className="text-xs text-zinc-500">
            {totalHours.toFixed(1)}h · {activeDays} active days
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <span>Less</span>
          {([0, 1, 2, 3, 4] as Cell['level'][]).map((lvl) => (
            <span
              key={lvl}
              className={`h-2.5 w-2.5 rounded-[3px] ${LEVEL_CLASSES[lvl]}`}
              aria-hidden
            />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <div className="grid grid-rows-7 gap-[3px] py-px text-[9px] text-zinc-600">
          {WEEKDAY_LABELS.map((label, i) => (
            <span
              key={i}
              className="flex h-3 items-center sm:h-3.5"
              aria-hidden
            >
              {label}
            </span>
          ))}
        </div>
        <div
          role="grid"
          aria-label="Aktywność godzinowa per dzień"
          className="flex flex-1 gap-[3px] overflow-x-auto"
        >
          {columns.map((col, ci) => (
            <div key={ci} role="row" className="grid flex-1 grid-rows-7 gap-[3px]">
              {col.map((cell) => (
                <div
                  key={cell.date}
                  role="gridcell"
                  title={`${cell.date} · ${cell.hours.toFixed(1)}h`}
                  aria-label={`${cell.date}: ${cell.hours.toFixed(1)} godzin`}
                  className={`h-3 rounded-[3px] sm:h-3.5 ${LEVEL_CLASSES[cell.level]}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
