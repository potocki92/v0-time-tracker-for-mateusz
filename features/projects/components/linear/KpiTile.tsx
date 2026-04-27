'use client'

import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LINEAR } from './linear.tokens'

type KpiTileProps = {
  label: string
  value: string
  icon?: LucideIcon
  meta?: string
  progress?: number
  accent?: 'emerald' | 'amber' | 'blue' | 'violet'
}

const ACCENT: Record<NonNullable<KpiTileProps['accent']>, { bar: string; halo: string }> = {
  emerald: { bar: 'bg-emerald-500', halo: 'shadow-[inset_0_0_0_1px_rgba(16,185,129,0.18)]' },
  amber:   { bar: 'bg-amber-500',   halo: 'shadow-[inset_0_0_0_1px_rgba(245,158,11,0.18)]' },
  blue:    { bar: 'bg-blue-500',    halo: 'shadow-[inset_0_0_0_1px_rgba(59,130,246,0.18)]' },
  violet:  { bar: 'bg-violet-500',  halo: 'shadow-[inset_0_0_0_1px_rgba(139,92,246,0.18)]' },
}

export function KpiTile({ label, value, icon: Icon, meta, progress, accent = 'emerald' }: KpiTileProps) {
  const tone = ACCENT[accent]
  return (
    <div
      className={cn(
        'rounded-xl border p-3.5 sm:p-4',
        LINEAR.border,
        LINEAR.surface,
        tone.halo,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={LINEAR.eyebrow}>{label}</p>
        {Icon && (
          <span className="rounded-md border border-[#1a1a1a] bg-[#0e0e0e] p-1 text-zinc-300">
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </span>
        )}
      </div>
      <p className="mt-2 truncate text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-[28px]">
        {value}
      </p>

      {progress !== undefined && (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[#161616]">
          <div
            className={cn('h-full rounded-full transition-[width]', tone.bar)}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            aria-hidden
          />
        </div>
      )}

      {meta && (
        <p className="mt-2 truncate text-[11.5px] text-zinc-500 sm:text-xs">{meta}</p>
      )}
    </div>
  )
}
