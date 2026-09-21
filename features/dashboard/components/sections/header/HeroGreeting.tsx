'use client'

import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import type { AppFormat } from '@/lib/format'
import { useFormat } from '@/lib/format/client'
import { getTodayLocalDateString } from '@/lib/helpers'
import { cn } from '@/lib/utils'
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

function formatDateline(fmt: AppFormat, iso: string): string {
  const badge = fmt.dayBadge(iso)
  const weekday = fmt.weekday(iso, 'long').toUpperCase()
  return `${weekday} · ${badge.day} ${badge.month} ${iso.slice(0, 4)}`
}

function shapingCopy(fmt: AppFormat, iso: string): string {
  return `Tak prezentuje się ${fmt.monthName(iso, 'long')}.`
}

export function HeroGreeting({ userName, range, onChangeRange }: Props) {
  const fmt = useFormat()
  const today = getTodayLocalDateString()
  const dateline = `${formatDateline(fmt, today)} · ${fmt.isoWeek(today)}`
  const name = userName?.split(' ')[0] ?? ''

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <SectionEyebrow>{dateline}</SectionEyebrow>
        {/* Powitanie i zdanie o okresie stoja w dwoch liniach na KAZDEJ
            szerokosci. Doklejone na desktopie do <h1> zdanie „— Tak prezentuje
            sie wrzesien." robilo z naglowka linie dlugosci calej karty, czyli
            dokladnie te miare, ktorej naglowek nie powinien miec. */}
        <h1 className="text-3xl font-semibold leading-[1.2] tracking-tight text-white sm:text-4xl">
          {greetingByHour()}
          {name ? `, ${name}` : ''}
        </h1>
        <p className="text-xs leading-[1.4] text-zinc-400 sm:text-sm">
          {shapingCopy(fmt, today)}
        </p>
      </div>

      {/* Pelna szerokosc i cztery rowne kolumny: na telefonie kazda zakladka
          ma wtedy ~88 px i caly kafelek jest celem dotykowym, a nie sam napis.
          `grid` zamiast `inline-flex`, bo rowne kolumny nie moga zalezec od
          dlugosci slowa („Rok" kontra „Kwartal").

          Od sm: szerokosc jest przycieta — rozciagniety na 1440 px przelacznik
          czterech slow to pas pustki, a nie kontrolka. */}
      <div
        role="tablist"
        aria-label="Okres"
        className="grid h-11 grid-cols-4 gap-1 rounded-xl border border-hairline bg-surface-1 p-1 sm:max-w-md"
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
              className={cn(
                'flex items-center justify-center rounded-lg text-2xs transition-colors sm:text-xs',
                active
                  ? 'bg-brand-500/15 font-semibold text-white ring-1 ring-inset ring-brand-500/40'
                  : 'font-medium text-zinc-400 hover:text-zinc-200',
              )}
            >
              {t.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}
