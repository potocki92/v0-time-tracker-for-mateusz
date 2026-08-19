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
  accent?: boolean
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
 * Tony feedu zachowują semantykę (success/info/warning/neutral), ale paleta
 * jest spójna z resztą "linear" dashboardu — sukces = neonowa zieleń (emerald),
 * informacja = sky, ostrzeżenie = amber, neutralny = zinc. Bez zmian względem
 * wcześniejszego pomysłu, jednak zamiast pełnej kropki dajemy cienki
 * pulsujący ring 2 px — bardziej elegancko i lepiej widać tone.
 */
const TONE: Record<ActivityItem['tone'], string> = {
  success: 'bg-emerald-400 shadow-[0_0_0_2px_rgba(16,185,129,0.18)]',
  info: 'bg-sky-400 shadow-[0_0_0_2px_rgba(56,189,248,0.18)]',
  warning: 'bg-amber-400 shadow-[0_0_0_2px_rgba(251,191,36,0.18)]',
  neutral: 'bg-zinc-500',
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
      accent: true,
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
      className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4"
    >
      <header className="flex items-center justify-between">
        <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Aktywność
        </p>
        <Link
          href="/calendar"
          className="inline-flex items-center gap-1 rounded-md border border-[#1a1a1a] bg-[#0e0e0e] px-2 py-1 text-2xs font-medium text-zinc-300 transition hover:border-[#262626] hover:bg-[#141414]"
        >
          Zobacz wszystkie
        </Link>
      </header>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
        {tiles.map(({ icon: Icon, label, value, hint, accent }) => (
          <div
            key={label}
            className="group rounded-lg border border-[#1a1a1a] bg-[#0e0e0e] p-3 transition hover:border-[#262626] hover:bg-[#111]"
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-md',
                  accent
                    ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                    : 'bg-[#161616] text-zinc-400 ring-1 ring-[#1f1f1f]',
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="text-2xs font-medium text-zinc-500">{hint}</span>
            </div>
            <p className="mt-2 text-xl font-semibold tabular-nums leading-[1.15] text-white sm:text-2xl sm:font-bold">
              {value}
            </p>
            <p className="text-2xs text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      {feed.length > 0 && (
        <ul role="list" className="mt-4 divide-y divide-[#161616]">
          {feed.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <span
                aria-hidden
                className={cn(
                  'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                  TONE[item.tone],
                )}
              />
              <p className="min-w-0 flex-1 text-xs leading-[1.45] text-white sm:text-sm">
                {item.text}
              </p>
              <span className="shrink-0 text-2xs text-zinc-500">
                {item.ago}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
