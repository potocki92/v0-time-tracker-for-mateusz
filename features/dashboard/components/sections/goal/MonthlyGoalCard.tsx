'use client'

import { Pencil } from 'lucide-react'
import { formatCurrency } from '@/lib/helpers'
import type { Currency } from '../../../types/dashboard.types'

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
  const size = 112
  const stroke = 9
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
        aria-label={`${clamped.toFixed(0)}% celu miesięcznego`}
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
        <span className="text-xl font-bold tabular-nums text-white">{clamped.toFixed(0)}%</span>
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
  const headline = reached ? 'Cel osiągnięty' : 'Cel w trakcie realizacji'

  return (
    <section
      aria-label="Cel miesięczny"
      className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4"
    >
      <header className="flex items-center justify-between">
        <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Cel miesięczny
        </p>
        <button
          type="button"
          aria-label="Edytuj cel miesięczny"
          onClick={onEdit}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#1a1a1a] bg-[#0e0e0e] text-zinc-500 transition hover:bg-[#141414] hover:text-white"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
        </button>
      </header>

      <div className="mt-3.5 flex items-center gap-4">
        <CircularProgress value={progress} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-[1.3] text-white sm:text-sm">{headline}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums leading-[1.2] text-white sm:text-2xl sm:font-bold">
            {formatCurrency(target, currency)}
          </p>
          {reachedDate && reached ? (
            <p className="text-2xs leading-[1.35] text-zinc-500 sm:text-xs">Osiągnięty {reachedDate}</p>
          ) : (
            <p className="text-2xs leading-[1.35] text-zinc-500 sm:text-xs">
              Aktualnie {formatCurrency(current, currency)}
            </p>
          )}
          <p className="mt-1 text-2xs leading-[1.35] text-zinc-600">z {formatCurrency(target, currency)}</p>
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-[#1a1a1a] bg-[#0e0e0e] px-3 py-2.5">
          <p className="text-2xs font-semibold uppercase tracking-wider text-zinc-500">Nadwyżka</p>
          <p className="mt-1 text-base font-semibold tabular-nums text-emerald-400">
            +{formatCurrency(surplus, currency)}
          </p>
        </div>
        <div className="rounded-lg border border-[#1a1a1a] bg-[#0e0e0e] px-3 py-2.5">
          <p className="text-2xs font-semibold uppercase tracking-wider text-zinc-500">Seria</p>
          <p className="mt-1 text-base font-semibold tabular-nums text-white">
            {streakDays} dni
          </p>
        </div>
      </div>
    </section>
  )
}
