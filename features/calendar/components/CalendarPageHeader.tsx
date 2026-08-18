'use client'

import { CalendarDays } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { MONTH_NAMES } from '@/lib/types'

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
    <div className="sticky top-0 z-30 border-b border-[#1a1a1a] bg-black/80 backdrop-blur-sm">
      <div className="container flex h-12 items-center gap-2.5 px-4 sm:h-14 sm:gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10">
            <CalendarDays className="h-4 w-4 text-emerald-400" />
          </div>
          <h1 className="text-sm font-semibold tracking-tight text-white">Kalendarz</h1>
        </div>

        <Separator orientation="vertical" className="h-5 bg-[#1a1a1a]" />

        <span className="truncate text-xs text-zinc-500">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </span>

        <div className="ml-auto flex items-center gap-2 text-[11px] text-zinc-500">
          <span className="hidden sm:inline">
            {workDays} dni pracy • {totalEntries} wpisów
          </span>
          <span className="sm:hidden rounded-full bg-[#161616] px-2 py-0.5 font-medium text-zinc-300">
            {workDays}d
          </span>
        </div>
      </div>
    </div>
  )
}
