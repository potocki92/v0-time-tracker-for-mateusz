import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatMonthTitle } from '@/lib/format'
import { getMonthKey } from '@/lib/helpers'
import { DAY_NAMES } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  currentMonth: number
  currentYear: number
  isCurrentMonth: boolean
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export function CalendarMonthNav({
  currentMonth,
  currentYear,
  isCurrentMonth,
  onPrev,
  onNext,
  onToday,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 border-hairline bg-surface-2 text-zinc-300 hover:bg-surface-3 hover:text-white"
          onClick={onPrev}
          aria-label="Poprzedni miesiąc"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <h2 className="truncate text-sm font-semibold tracking-tight text-white sm:text-base">
            {formatMonthTitle(getMonthKey(currentYear, currentMonth))}
          </h2>
          {!isCurrentMonth && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToday}
              className="h-6 px-2 text-2xs font-semibold uppercase tracking-wide text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
            >
              Dziś
            </Button>
          )}
          {isCurrentMonth && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-2xs font-semibold text-emerald-400">
              Teraz
            </span>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 border-hairline bg-surface-2 text-zinc-300 hover:bg-surface-3 hover:text-white"
          onClick={onNext}
          aria-label="Następny miesiąc"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {DAY_NAMES.map((day, index) => (
          <div
            key={day}
            className={cn(
              'py-1 text-center text-2xs font-medium uppercase tracking-widest',
              index >= 5 ? 'text-zinc-400' : 'text-zinc-400',
            )}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  )
}
