'use client'

import type { TimeRange } from '../../types/dashboard.types'

type Props = {
  userName?: string
  range: TimeRange
  onChangeRange: (r: TimeRange) => void
}

const TABS: { value: TimeRange; label: string }[] = [
  { value: 'current_week', label: 'Tydzień' },
  { value: 'current_month', label: 'Miesiąc' },
  { value: 'current_quarter', label: 'Kwartał' },
  { value: 'current_year', label: 'Rok' },
]

function greetingByHour(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Dobranoc'
  if (h < 12) return 'Dzień dobry'
  if (h < 18) return 'Miłego popołudnia'
  return 'Dobry wieczór'
}

function formatDateline(d: Date): string {
  const weekday = d.toLocaleDateString('pl-PL', { weekday: 'long' }).toUpperCase()
  const month = d.toLocaleDateString('pl-PL', { month: 'short' }).toUpperCase()
  const day = String(d.getDate()).padStart(2, '0')
  const year = d.getFullYear()
  return `${weekday} · ${day} ${month} ${year}`
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
  const monthName = d.toLocaleDateString('pl-PL', { month: 'long' })
  return `Tak prezentuje się ${monthName}.`
}

export function HeroGreeting({ userName, range, onChangeRange }: Props) {
  const now = new Date()
  const dateline = `${formatDateline(now)} · TYDZIEŃ ${isoWeekNumber(now)}`
  const name = userName?.split(' ')[0] ?? ''

  return (
    <section className="space-y-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
        {dateline}
      </p>
      <div>
        {/* Mobile: stacked.  Desktop (sm+): inline „— here's how April is shaping up." */}
        <h1 className="text-[22px] font-semibold leading-[1.25] tracking-tight text-white sm:text-[28px]">
          {greetingByHour()}{name ? `, ${name}` : ''}
          <span className="ml-2 hidden font-normal text-zinc-500 sm:inline">
            — {shapingCopy(now)}
          </span>
        </h1>
        <p className="mt-1 text-[12.5px] leading-[1.4] text-zinc-500 sm:hidden">
          {shapingCopy(now)}
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Okres"
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
                  ? 'rounded-lg bg-[#161616] px-3 py-1.5 text-[11.5px] font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)] sm:px-3.5 sm:text-xs'
                  : 'rounded-lg px-3 py-1.5 text-[11.5px] font-medium text-zinc-500 transition hover:text-zinc-200 sm:px-3.5 sm:text-xs'
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
