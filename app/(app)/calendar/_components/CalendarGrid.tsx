import type { Client, WorkEntry } from '@/lib/types'
import { getDateString } from '@/lib/helpers'
import { DayCell } from './DayCell'

interface CalendarGridProps {
  daysInMonth: number
  firstDayOfMonth: number
  currentMonth: number
  currentYear: number
  entriesByDate: Map<string, WorkEntry>
  clients: Client[]
  onOpenDay: (day: number) => void
  eurToPln: number
}

export function CalendarGrid({
  daysInMonth,
  firstDayOfMonth,
  currentMonth,
  currentYear,
  entriesByDate,
  clients,
  onOpenDay,
  eurToPln,
}: CalendarGridProps) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: firstDayOfMonth }).map((_, i) => (
        <div key={`empty-${i}`} className="h-20 sm:h-24" />
      ))}

      {Array.from({ length: daysInMonth }).map((_, i) => {
        const day = i + 1
        const dateStr = getDateString(currentYear, currentMonth, day)
        const entry = entriesByDate.get(dateStr)
        const dayOfWeek = (firstDayOfMonth + i) % 7
        const isWeekend = dayOfWeek >= 5

        return (
          <div key={day} className={isWeekend ? 'rounded-lg bg-muted/20 p-[1px]' : ''}>
            <DayCell
              day={day}
              month={currentMonth}
              year={currentYear}
              entry={entry}
              clients={clients}
              eurToPln={eurToPln}
              onClick={onOpenDay}
            />
          </div>
        )
      })}
    </div>
  )
}
