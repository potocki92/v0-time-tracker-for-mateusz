import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DAY_NAMES, MONTH_NAMES } from '@/lib/types'
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
          className="h-8 w-8 shrink-0 border-border/60"
          onClick={onPrev}
          aria-label="Poprzedni miesiąc"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <h2 className="truncate text-sm font-semibold tracking-tight sm:text-base">
            {MONTH_NAMES[currentMonth]}{' '}
            <span className="font-normal text-muted-foreground">{currentYear}</span>
          </h2>
          {!isCurrentMonth && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToday}
              className="h-6 px-2 text-[10px] font-semibold uppercase tracking-wide text-primary hover:bg-primary/10"
            >
              Dziś
            </Button>
          )}
          {isCurrentMonth && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              Teraz
            </span>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 border-border/60"
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
              'py-1 text-center text-[10px] font-medium uppercase tracking-widest sm:text-[11px]',
              index >= 5 ? 'text-muted-foreground/60' : 'text-muted-foreground',
            )}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  )
}
