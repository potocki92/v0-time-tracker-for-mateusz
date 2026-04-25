'use client'

import { Clock, Users, CalendarOff, type LucideIcon } from 'lucide-react'

type Props = {
  totalHours: number
  totalDays: number
  clientsCount: number
  absences: number
}

type Stat = {
  icon: LucideIcon
  label: string
  value: string
  sublabel?: string
}

export function StatsRow({ totalHours, totalDays, clientsCount, absences }: Props) {
  const stats: Stat[] = [
    {
      icon: Clock,
      label: 'Hours',
      value: `${totalHours}h`,
      sublabel: `${totalDays} days`,
    },
    {
      icon: Users,
      label: 'Clients',
      value: String(clientsCount),
    },
    {
      icon: CalendarOff,
      label: 'Absences',
      value: String(absences),
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {stats.map(({ icon: Icon, label, value, sublabel }) => (
        <div
          key={label}
          className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-3 sm:p-4"
        >
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Icon className="h-3.5 w-3.5" aria-hidden />
            <span className="text-[10px] font-medium uppercase tracking-wider">
              {label}
            </span>
          </div>
          <p className="mt-2 text-xl font-semibold tabular-nums text-white sm:text-2xl">
            {value}
          </p>
          {sublabel && (
            <p className="mt-0.5 text-[11px] text-zinc-500">{sublabel}</p>
          )}
        </div>
      ))}
    </div>
  )
}
