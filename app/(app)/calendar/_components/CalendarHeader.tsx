import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DAY_NAMES, MONTH_NAMES } from '@/lib/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarHeaderProps {
  currentMonth: number
  currentYear: number
  onPrevMonth: () => void
  onNextMonth: () => void
}

export function CalendarHeader({ currentMonth, currentYear, onPrevMonth, onNextMonth }: CalendarHeaderProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onPrevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-lg">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onNextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-7 gap-1">
          {DAY_NAMES.map((day, index) => (
            <div
              key={day}
              className={`py-2 text-center text-xs font-medium ${index >= 5 ? 'bg-muted/20 text-muted-foreground rounded-md' : ''}`}
            >
              {day}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
