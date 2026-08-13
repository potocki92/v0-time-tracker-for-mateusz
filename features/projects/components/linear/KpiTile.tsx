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

// Sam pasek niesie akcent. Wewnętrzne poświaty na obramowaniu (po jednej na
// każdy kafelek, w czterech różnych kolorach) dokładały się do wizualnego szumu.
const ACCENT_BAR: Record<NonNullable<KpiTileProps['accent']>, string> = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  violet: 'bg-violet-500',
}

export function KpiTile({ label, value, icon: Icon, meta, progress, accent = 'emerald' }: KpiTileProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3.5 sm:p-4',
        LINEAR.border,
        LINEAR.surface,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={LINEAR.eyebrow}>{label}</p>
        {Icon && (
          <span className={cn('rounded-md border p-1 text-zinc-300', LINEAR.border, LINEAR.surfaceElevated)}>
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </span>
        )}
      </div>
      {/* Stały rozmiar zamiast płynnego `text-2xl` (clamp do 3rem w globals.css),
          przez który kwoty ucinały się w dwukolumnowej siatce na telefonie. */}
      <p className="mt-2 truncate text-[26px] font-semibold leading-none tabular-nums tracking-tight text-white sm:text-[30px]">
        {value}
      </p>

      {progress !== undefined && (
        <div className={cn('mt-3 h-1 w-full overflow-hidden rounded-full', LINEAR.track)}>
          <div
            className={cn('h-full rounded-full transition-[width]', ACCENT_BAR[accent])}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            aria-hidden
          />
        </div>
      )}

      {meta && (
        <p className="mt-2 truncate text-[11.5px] text-zinc-400 sm:text-xs">{meta}</p>
      )}
    </div>
  )
}
