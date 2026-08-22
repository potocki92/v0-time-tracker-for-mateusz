'use client'

import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import {
  formatDayBadge,
  formatIsoWeek,
  formatMonthName,
  formatWeekday,
} from '@/lib/format'
import { getTodayLocalDateString } from '@/lib/helpers'
import type { TimeRange } from '../../../types/dashboard.types'

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

function formatDateline(iso: string): string {
  const badge = formatDayBadge(iso)
  const weekday = formatWeekday(iso, 'long').toUpperCase()
  return `${weekday} · ${badge.day} ${badge.month} ${iso.slice(0, 4)}`
}

function shapingCopy(iso: string): string {
  return `Tak prezentuje się ${formatMonthName(iso, 'long')}.`
}

export function HeroGreeting({ userName, range, onChangeRange }: Props) {
  const today = getTodayLocalDateString()
  const dateline = `${formatDateline(today)} · ${formatIsoWeek(today)}`
  const name = userName?.split(' ')[0] ?? ''

  return (
    <section className="space-y-2.5">
      <SectionEyebrow>{dateline}</SectionEyebrow>
      <div>
        {/* Mobile: stacked.  Desktop (sm+): inline „— here's how April is shaping up." */}
        <h1 className="text-2xl font-semibold leading-[1.25] text-white sm:text-3xl">
          {greetingByHour()}{name ? `, ${name}` : ''}
          <span className="ml-2 hidden font-normal text-zinc-400 sm:inline">
            — {shapingCopy(today)}
          </span>
        </h1>
        <p className="mt-1 text-xs leading-[1.4] text-zinc-400 sm:hidden">
          {shapingCopy(today)}
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Okres"
        className="inline-flex rounded-lg border border-hairline bg-surface-1 p-1"
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
                  ? 'rounded-md bg-surface-3 px-3 py-1.5 text-2xs font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)] sm:px-3.5 sm:text-xs'
                  : 'rounded-md px-3 py-1.5 text-2xs font-medium text-zinc-400 transition hover:text-zinc-200 sm:px-3.5 sm:text-xs'
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
