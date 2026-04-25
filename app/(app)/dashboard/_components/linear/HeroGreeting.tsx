'use client'

import type { TimeRange } from '../../_domain/dashboard.types'

type Props = {
  userName?: string
  range: TimeRange
  onChangeRange: (r: TimeRange) => void
}

const TABS: { value: TimeRange; label: string }[] = [
  { value: 'current_week', label: 'Week' },
  { value: 'current_month', label: 'Month' },
  { value: 'current_quarter', label: 'Quarter' },
  { value: 'current_year', label: 'Year' },
]

function greetingByHour(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function formatDateline(d: Date): string {
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const day = String(d.getDate()).padStart(2, '0')
  const year = d.getFullYear()
  return `${weekday} · ${month} ${day}, ${year}`
}

function isoWeekNumber(d: Date): number {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNr = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNr + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const firstDayNr = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNr + 3)
  return 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000))
}

function shapingCopy(d: Date): string {
  const monthName = d.toLocaleDateString('en-US', { month: 'long' })
  return `Here's how ${monthName} is shaping up.`
}

export function HeroGreeting({ userName, range, onChangeRange }: Props) {
  const now = new Date()
  const dateline = `${formatDateline(now)} · WEEK ${isoWeekNumber(now)}`
  const name = userName?.split(' ')[0] ?? 'there'

  return (
    <section className="space-y-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
        {dateline}
      </p>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {greetingByHour()}, {name}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{shapingCopy(now)}</p>
      </div>

      <div
        role="tablist"
        aria-label="Period"
        className="inline-flex rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-1"
      >
        {TABS.map((t) => {
          const active = range === t.value
          return (
            <button
              key={t.value}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onChangeRange(t.value)}
              className={
                active
                  ? 'rounded-lg bg-[#161616] px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)]'
                  : 'rounded-lg px-3.5 py-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-200'
              }
            >
              {t.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}
