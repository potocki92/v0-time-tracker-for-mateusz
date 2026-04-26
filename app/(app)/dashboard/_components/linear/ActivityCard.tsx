'use client'

import Link from 'next/link'
import {
  Briefcase,
  CalendarOff,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type ActivityItem = {
  id: string
  text: React.ReactNode
  ago: string
  tone: 'success' | 'info' | 'warning' | 'neutral'
}

type StatTile = {
  icon: LucideIcon
  label: string
  value: string
  hint: string
}

type Props = {
  clientsCount: number
  defaultClientsCount: number
  activeJobs: number
  totalJobs: number
  absences: number
  feed: ActivityItem[]
}

/**
 * Tone → klasy oparte WYŁĄCZNIE na tokenach design systemu.
 * Dzięki temu sekcja sama dopasowuje się do wybranego motywu (Emerald,
 * Ocean, Sunset itp.) bez ręcznego nadpisywania.
 */
const TONE: Record<ActivityItem['tone'], { dot: string; ring: string }> = {
  success: {
    dot: 'bg-primary',
    ring: 'shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_25%,transparent)]',
  },
  info: {
    dot: 'bg-accent-foreground',
    ring: 'shadow-[0_0_0_3px_color-mix(in_oklch,var(--accent-foreground)_20%,transparent)]',
  },
  warning: {
    dot: 'bg-warning',
    ring: 'shadow-[0_0_0_3px_color-mix(in_oklch,var(--warning)_25%,transparent)]',
  },
  neutral: {
    dot: 'bg-muted-foreground',
    ring: '',
  },
}

export function ActivityCard({
  clientsCount,
  defaultClientsCount,
  activeJobs,
  totalJobs,
  absences,
  feed,
}: Props) {
  const tiles: StatTile[] = [
    {
      icon: Users,
      label: 'Klienci',
      value: String(clientsCount),
      hint: `${defaultClientsCount} domyśl.`,
    },
    {
      icon: Briefcase,
      label: 'Aktywne zlecenia',
      value: String(activeJobs),
      hint: `z ${totalJobs}`,
    },
    {
      icon: CalendarOff,
      label: 'Nieobecności',
      value: String(absences),
      hint: 'w mies.',
    },
  ]

  return (
    <section
      aria-label="Aktywność"
      className="rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm sm:p-5"
    >
      <header className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Aktywność
        </p>
        <Link
          href="/calendar"
          className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/40 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Zobacz wszystkie
        </Link>
      </header>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {tiles.map(({ icon: Icon, label, value, hint }) => (
          <div
            key={label}
            className="group rounded-xl border border-border/50 bg-background/40 p-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20 transition-colors group-hover:bg-primary/20">
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wide">{hint}</span>
            </div>
            <p className="mt-2 text-[20px] font-semibold tabular-nums leading-[1.15] text-foreground sm:text-2xl sm:font-bold">
              {value}
            </p>
            <p className="text-[10.5px] text-muted-foreground sm:text-[11px]">{label}</p>
          </div>
        ))}
      </div>

      {feed.length > 0 && (
        <ul role="list" className="mt-4 divide-y divide-border/40">
          {feed.map((item) => {
            const tone = TONE[item.tone]
            return (
              <li
                key={item.id}
                className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span
                  aria-hidden
                  className={cn(
                    'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                    tone.dot,
                    tone.ring,
                  )}
                />
                <p className="min-w-0 flex-1 text-[12.5px] leading-[1.45] text-foreground sm:text-sm">
                  {item.text}
                </p>
                <span className="shrink-0 text-[10.5px] text-muted-foreground sm:text-[11px]">
                  {item.ago}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
