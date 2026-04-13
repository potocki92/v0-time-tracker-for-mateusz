import { Button } from '@/components/ui/button'
import { DAY_NAMES, MONTH_NAMES } from '@/lib/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarHeaderProps {
  currentMonth: number
  currentYear: number
  onPrevMonth: () => void
  onNextMonth: () => void
}

export function CalendarHeader({
  currentMonth,
  currentYear,
  onPrevMonth,
  onNextMonth,
}: CalendarHeaderProps) {
  const isCurrentMonth =
    currentMonth === new Date().getMonth() &&
    currentYear === new Date().getFullYear()

  return (
    <div className="space-y-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border/60"
          onClick={onPrevMonth}
          aria-label="Poprzedni miesiąc"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold tracking-tight">
            {MONTH_NAMES[currentMonth]}{' '}
            <span className="text-muted-foreground font-normal">{currentYear}</span>
          </h2>
          {isCurrentMonth && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              Teraz
            </span>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border/60"
          onClick={onNextMonth}
          aria-label="Następny miesiąc"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day names row */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map((day, index) => (
          <div
            key={day}
            className={`py-1.5 text-center text-[11px] font-medium tracking-wide ${
              index >= 5
                ? 'text-muted-foreground/60'
                : 'text-muted-foreground'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  )
}