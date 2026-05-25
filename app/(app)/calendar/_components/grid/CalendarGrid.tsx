import type { Client, WorkEntry } from '@/lib/types'
import { getDateString } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import type { TripDayMarker } from '../../_domain/calendar.selectors'
import { DayCell } from './DayCell'

interface Props {
  daysInMonth: number
  firstDayOfMonth: number
  currentMonth: number
  currentYear: number
  entriesByDate: Map<string, WorkEntry[]>
  tripDayMarkers?: Map<number, TripDayMarker>
  clients: Client[]
  eurToPln: number
  onOpenDay: (day: number) => void
}

export function CalendarGrid({
  daysInMonth,
  firstDayOfMonth,
  currentMonth,
  currentYear,
  entriesByDate,
  tripDayMarkers,
  clients,
  eurToPln,
  onOpenDay,
}: Props) {
  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
      {Array.from({ length: firstDayOfMonth }).map((_, i) => {
        const isWeekend = i >= 5
        return (
          <div
            key={`empty-${i}`}
            className={cn(
              'h-16 rounded-lg sm:h-24',
              isWeekend ? 'bg-[#0e0e0e]' : '',
            )}
            aria-hidden
          />
        )
      })}

      {Array.from({ length: daysInMonth }).map((_, i) => {
        const day = i + 1
        const dateStr = getDateString(currentYear, currentMonth, day)
        const dayEntries = entriesByDate.get(dateStr) ?? []
        const entry =
          dayEntries.find((dayEntry) => (dayEntry.entry_kind ?? 'real') === 'real')
          ?? dayEntries[0]
        const dayOfWeek = (firstDayOfMonth + i) % 7
        const isWeekend = dayOfWeek >= 5

        return (
          <DayCell
            key={day}
            day={day}
            month={currentMonth}
            year={currentYear}
            entry={entry}
            isWeekend={isWeekend}
            tripMarker={tripDayMarkers?.get(day)}
            clients={clients}
            eurToPln={eurToPln}
            onClick={onOpenDay}
          />
        )
      })}
    </div>
  )
}
