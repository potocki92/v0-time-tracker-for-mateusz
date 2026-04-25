'use client'

import { useMemo } from 'react'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { formatCurrency } from '@/lib/helpers'

export type WeeklyDay = {
  date: string
  weekday: string // Mon..Sun
  hours: number
  isToday: boolean
  isFuture: boolean
}

type Props = {
  days: WeeklyDay[]
  totalHours: number
  earned: number
  earnedCurrency: 'PLN' | 'EUR'
  trendPercent: number | null
}

export function WeeklyGlanceCard({
  days,
  totalHours,
  earned,
  earnedCurrency,
  trendPercent,
}: Props) {
  const max = useMemo(() => {
    const m = Math.max(...days.map((d) => d.hours), 1)
    return m
  }, [days])

  const TrendIcon =
    trendPercent === null || trendPercent === 0
      ? Minus
      : trendPercent > 0
        ? ArrowUpRight
        : ArrowDownRight
  const trendColor = trendPercent === null
    ? 'text-zinc-400'
    : trendPercent >= 0
      ? 'text-emerald-400'
      : 'text-red-400'
  const trendBg = trendPercent === null
    ? 'bg-zinc-500/10 ring-zinc-500/20'
    : trendPercent >= 0
      ? 'bg-emerald-500/10 ring-emerald-500/30'
      : 'bg-red-500/10 ring-red-500/30'

  return (
    <section
      aria-label="This week at a glance"
      className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:p-5"
    >
      <header className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          This week at a glance
        </p>
        {trendPercent !== null && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${trendBg} ${trendColor}`}
          >
            <TrendIcon className="h-3 w-3" aria-hidden />
            {trendPercent > 0 ? '+' : ''}
            {trendPercent.toFixed(1)}%
          </span>
        )}
      </header>

      <div className="mt-4 grid grid-cols-7 gap-2">
        {days.map((d) => {
          const ratio = max > 0 ? d.hours / max : 0
          const isInactive = d.isFuture || d.hours === 0
          return (
            <div key={d.date} className="flex flex-col items-center gap-2">
              <div className="flex h-24 w-full items-end">
                <div
                  className={`w-full rounded-md transition-all ${
                    isInactive
                      ? 'bg-[#101410]'
                      : d.isToday
                        ? 'bg-emerald-400 shadow-[0_0_18px_rgba(34,197,94,0.55)]'
                        : 'bg-emerald-700/80'
                  }`}
                  style={{ height: isInactive ? '14%' : `${Math.max(14, ratio * 100)}%` }}
                  aria-hidden
                />
              </div>
              <span
                className={`text-[11px] font-semibold ${
                  d.isToday ? 'text-emerald-400' : 'text-zinc-400'
                }`}
              >
                {d.weekday}
              </span>
              <span className="text-[11px] tabular-nums text-zinc-500">
                {d.isFuture || d.hours === 0 ? '—' : Math.round(d.hours)}
              </span>
            </div>
          )
        })}
      </div>

      <footer className="mt-4 flex items-center justify-between border-t border-[#161616] pt-3 text-xs">
        <p className="text-zinc-500">
          Total <span className="font-semibold text-white">{totalHours.toFixed(0)} h</span>
        </p>
        <p className="text-zinc-500">
          Earned{' '}
          <span className="font-semibold text-white">
            {formatCurrency(earned, earnedCurrency)}
          </span>
        </p>
      </footer>
    </section>
  )
}
