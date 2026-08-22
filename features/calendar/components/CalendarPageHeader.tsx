'use client'

import { CalendarDays } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { formatMonthTitle } from '@/lib/format'
import { getMonthKey } from '@/lib/helpers'

interface Props {
  currentMonth: number
  currentYear: number
  workDays: number
  totalEntries: number
}

/**
 * Sticky page header — spójny ze wzorcem dashboardu: marker modułu + aktualny
 * okres + szybka metryka po prawej. Skompresowany na mobile (h-12) dla maksymalnej
 * ilości treści na ekranie.
 */
export function CalendarPageHeader({
  currentMonth,
  currentYear,
  workDays,
  totalEntries,
}: Props) {
  return (
    // `top-14 z-20`: nad tym paskiem stoi przyklejony WorkspaceHeader (h-14, z-30).
    <div className="sticky top-14 z-20 border-b border-hairline bg-surface-0/80 backdrop-blur-sm">
      <div className="container flex h-12 items-center gap-2.5 px-4 sm:h-14 sm:gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10">
            <CalendarDays className="h-4 w-4 text-emerald-400" />
          </div>
          <h1 className="text-sm font-semibold tracking-tight text-white">Kalendarz</h1>
        </div>

        <Separator orientation="vertical" className="h-5 bg-hairline" />

        <span className="truncate text-xs text-zinc-400">
          {formatMonthTitle(getMonthKey(currentYear, currentMonth))}
        </span>

        <div className="ml-auto flex items-center gap-2 text-2xs text-zinc-400">
          <span className="hidden sm:inline">
            {workDays} dni pracy • {totalEntries} wpisów
          </span>
          <span className="sm:hidden rounded-full bg-surface-3 px-2 py-0.5 font-medium text-zinc-300">
            {workDays}d
          </span>
        </div>
      </div>
    </div>
  )
}
