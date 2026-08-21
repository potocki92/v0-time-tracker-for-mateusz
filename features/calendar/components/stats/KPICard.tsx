'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  label: string
  icon: ReactNode
  className?: string
  children: ReactNode
  /** Aria label dla całej karty — pomocne, gdy zawartość jest wyłącznie wizualna. */
  ariaLabel?: string
}

/**
 * Bazowy KPI card — płaska, ciemna karta spójna z dashboardem (Pulpit):
 * tło #0a0a0a, obwódka #1a1a1a, emeraldowa ikona w pigułce.
 */
export function KPICard({ label, icon, className, children, ariaLabel }: Props) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        'relative overflow-hidden rounded-lg border border-hairline bg-surface-1 p-3 sm:p-4',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-2xs font-medium uppercase tracking-[0.14em] text-zinc-400">
          {label}
        </p>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 sm:h-9 sm:w-9"
          aria-hidden
        >
          {icon}
        </div>
      </div>
      {children}
    </div>
  )
}
