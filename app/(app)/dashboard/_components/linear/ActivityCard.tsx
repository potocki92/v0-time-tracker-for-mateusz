'use client'

import Link from 'next/link'
import {
  Briefcase,
  CalendarOff,
  Users,
  type LucideIcon,
} from 'lucide-react'

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

const TONE: Record<ActivityItem['tone'], string> = {
  success: 'bg-emerald-500',
  info: 'bg-sky-500',
  warning: 'bg-amber-500',
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
      className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:p-5"
    >
      <header className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Aktywność
        </p>
        <Link
          href="/calendar"
          className="inline-flex items-center gap-1 rounded-md border border-[#1a1a1a] bg-[#0e0e0e] px-2 py-1 text-[11px] font-medium text-zinc-300 transition hover:border-[#262626] hover:bg-[#141414]"
        >
          Zobacz wszystkie
        </Link>
      </header>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {tiles.map(({ icon: Icon, label, value, hint }) => (
          <div
            key={label}
            className="rounded-xl border border-[#1a1a1a] bg-[#0e0e0e] p-3"
          >
            <div className="flex items-center justify-between text-zinc-500">
              <Icon className="h-3.5 w-3.5" aria-hidden />
              <span className="text-[10px] font-medium">{hint}</span>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-white">{value}</p>
            <p className="text-[11px] text-zinc-500">{label}</p>
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
                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${TONE[item.tone]}`}
              />
              <p className="min-w-0 flex-1 text-sm text-white">{item.text}</p>
              <span className="shrink-0 text-[11px] text-zinc-500">{item.ago}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
