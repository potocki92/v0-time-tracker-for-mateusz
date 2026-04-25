'use client'

import { Pencil } from 'lucide-react'
import { formatCurrency } from '@/lib/helpers'
import type { Currency } from '../../_domain/dashboard.types'

type Props = {
  progress: number
  target: number
  currency: Currency
  current: number
  reachedDate: string | null
  streakDays: number
  onEdit?: () => void
}

function CircularProgress({ value }: { value: number }) {
  const size = 124
  const stroke = 10
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  const clamped = Math.min(100, Math.max(0, value))
  const offset = circ * (1 - clamped / 100)

  return (
    <div className="relative flex shrink-0 items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        role="img"
        aria-label={`${clamped.toFixed(0)} percent of monthly goal`}
      >
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#1a1a1a" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#22c55e"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          fill="none"
          style={{
            transition: 'stroke-dashoffset 600ms ease',
            filter: 'drop-shadow(0 0 10px rgba(34,197,94,0.6))',
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold tabular-nums text-white">{clamped.toFixed(0)}%</span>
      </div>
    </div>
  )
}

export function MonthlyGoalCard({
  progress,
  target,
  currency,
  current,
  reachedDate,
  streakDays,
  onEdit,
}: Props) {
  const reached = progress >= 100
  const surplus = Math.max(0, current - target)
  const headline = reached ? 'Goal achieved' : 'Goal in progress'

  return (
    <section
      aria-label="Monthly goal"
      className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:p-5"
    >
      <header className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Monthly goal
        </p>
        <button
          type="button"
          aria-label="Edit monthly goal"
          onClick={onEdit}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#1a1a1a] bg-[#0e0e0e] text-zinc-500 transition hover:bg-[#141414] hover:text-white"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
        </button>
      </header>

      <div className="mt-4 flex items-center gap-4">
        <CircularProgress value={progress} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">{headline}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-white">
            {formatCurrency(target, currency)}
          </p>
          {reachedDate && reached ? (
            <p className="text-xs text-zinc-500">Reached on {reachedDate}</p>
          ) : (
            <p className="text-xs text-zinc-500">
              {formatCurrency(current, currency)} so far
            </p>
          )}
          <p className="mt-1 text-[11px] text-zinc-600">of {formatCurrency(target, currency)}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0e0e0e] px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Surplus</p>
          <p className="mt-1 text-base font-semibold tabular-nums text-emerald-400">
            +{formatCurrency(surplus, currency)}
          </p>
        </div>
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0e0e0e] px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Streak</p>
          <p className="mt-1 text-base font-semibold tabular-nums text-white">
            {streakDays} d
          </p>
        </div>
      </div>
    </section>
  )
}
