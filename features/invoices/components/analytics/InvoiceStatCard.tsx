'use client'

import { cn } from '@/lib/utils'

export type StatCardTone = 'neutral' | 'success' | 'warning' | 'action'

interface InvoiceStatCardProps {
  label: string
  amount: string
  secondaryAmount?: string
  badge?: string
  tone?: StatCardTone
  description?: string
}

const TONE_BADGE: Record<StatCardTone, string> = {
  neutral: 'bg-zinc-500/10 text-zinc-300 ring-1 ring-zinc-500/30',
  success: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  action: 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30',
}

export function InvoiceStatCard({
  label,
  amount,
  secondaryAmount,
  badge,
  tone = 'neutral',
  description,
}: InvoiceStatCardProps) {
  return (
    <section className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:p-5">
      <header className="flex items-center justify-between gap-3">
        <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          {label}
        </p>
        {badge && (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold tabular-nums',
              TONE_BADGE[tone],
            )}
          >
            {badge}
          </span>
        )}
      </header>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-white sm:text-4xl">
        {amount}
      </p>
      {secondaryAmount && (
        <p className="mt-0.5 text-xs font-medium tabular-nums text-zinc-500">
          {secondaryAmount}
        </p>
      )}
      {description && (
        <p className="mt-1 text-xs leading-snug text-zinc-500">{description}</p>
      )}
    </section>
  )
}
