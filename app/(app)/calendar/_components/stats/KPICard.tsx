'use client'

import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type KPIAccent = 'primary' | 'emerald' | 'sky' | 'amber'

interface Props {
  label: string
  icon: ReactNode
  accent?: KPIAccent
  className?: string
  children: ReactNode
  /** Aria label dla całej karty — pomocne, gdy zawartość jest wyłącznie wizualna. */
  ariaLabel?: string
}

const ACCENTS: Record<
  KPIAccent,
  { glow: string; iconBg: string; iconFg: string; ring: string }
> = {
  primary: {
    glow: 'before:bg-[radial-gradient(120%_80%_at_100%_0%,oklch(0.65_0.20_160/0.18),transparent_55%)]',
    iconBg: 'bg-primary/15',
    iconFg: 'text-primary',
    ring: 'group-hover:ring-primary/30',
  },
  emerald: {
    glow: 'before:bg-[radial-gradient(120%_80%_at_100%_0%,rgb(16_185_129/0.18),transparent_55%)]',
    iconBg: 'bg-emerald-500/15',
    iconFg: 'text-emerald-500 dark:text-emerald-400',
    ring: 'group-hover:ring-emerald-500/30',
  },
  sky: {
    glow: 'before:bg-[radial-gradient(120%_80%_at_100%_0%,rgb(56_189_248/0.18),transparent_55%)]',
    iconBg: 'bg-sky-500/15',
    iconFg: 'text-sky-500 dark:text-sky-400',
    ring: 'group-hover:ring-sky-500/30',
  },
  amber: {
    glow: 'before:bg-[radial-gradient(120%_80%_at_100%_0%,rgb(245_158_11/0.20),transparent_55%)]',
    iconBg: 'bg-amber-500/15',
    iconFg: 'text-amber-500 dark:text-amber-400',
    ring: 'group-hover:ring-amber-500/30',
  },
}

/**
 * Bazowy "bento" KPI card — gradient glow w prawym górnym rogu, ikona w pigułce,
 * subtelny lift na hover. Spójny dla całej siatki KPI nowego dashboardu.
 */
export function KPICard({
  label,
  icon,
  accent = 'primary',
  className,
  children,
  ariaLabel,
}: Props) {
  const a = ACCENTS[accent]
  return (
    <Card
      aria-label={ariaLabel}
      className={cn(
        'group relative overflow-hidden border-border/60 py-0 shadow-sm ring-1 ring-transparent',
        'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:ring-1',
        // Pseudo-element z radialnym gradientem (nie blokuje interakcji).
        'before:pointer-events-none before:absolute before:inset-0 before:opacity-80 before:transition-opacity before:duration-500 group-hover:before:opacity-100',
        a.glow,
        a.ring,
        className,
      )}
    >
      <CardContent className="relative p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px]">
            {label}
          </p>
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg sm:h-9 sm:w-9',
              a.iconBg,
              a.iconFg,
            )}
            aria-hidden
          >
            {icon}
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}
