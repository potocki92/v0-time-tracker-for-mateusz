import type { Client, WorkEntry } from '@/lib/types'
import { calculateEarnings, formatCurrency, getDateString, isFutureDate } from '@/lib/helpers'
import { STATUS_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const STATUS_BORDERS: Record<WorkEntry['status'], string> = {
  worked: 'border-l-[#10b981]',
  vacation: 'border-l-[#6366f1]',
  sick_leave: 'border-l-[#f59e0b]',
  day_off: 'border-l-[#64748b]',
  not_worked: 'border-l-destructive',
}

interface DayCellProps {
  day: number
  month: number
  year: number
  entry?: WorkEntry
  clients: Client[]
  eurToPln: number
  onClick: (day: number) => void
}

export function DayCell({ day, month, year, entry, clients, eurToPln, onClick }: DayCellProps) {
  const dateStr = getDateString(year, month, day)
  const todayStr = getDateString(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
  const isToday = todayStr === dateStr
  const isFuture = isFutureDate(dateStr)

  const client = entry?.client_id ? clients.find((c) => c.id === entry.client_id) : undefined
  const earnings = entry && client ? calculateEarnings(entry, client, eurToPln) : null

  const dayContent = (
    <button
      disabled={isFuture}
      onClick={() => onClick(day)}
      className={cn(
        'h-20 sm:h-24 rounded-lg border border-border bg-card p-2 text-left transition-all flex flex-col overflow-hidden',
        entry ? `border-l-4 ${STATUS_BORDERS[entry.status]}` : '',
        isToday ? 'ring-2 ring-[#39ff14]/90 ring-offset-2 ring-offset-background' : '',
        isFuture ? 'cursor-not-allowed bg-muted/30 opacity-50' : 'hover:scale-[1.02] hover:shadow-lg',
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-xs font-medium',
            isToday ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#39ff14]/20 text-[#14532d] dark:text-[#86efac]' : '',
          )}
        >
          {day}
        </span>
      </div>

      {entry && entry.status === 'worked' && (
        <div className="mt-auto text-[11px] leading-tight">
          {client?.work_type === 'hourly' ? (
            <span className="font-bold">{entry.hours}h</span>
          ) : (
            <span className="font-bold">{entry.quantity} {client?.unit}</span>
          )}
          {earnings && earnings.amount > 0 && (
            <div className="truncate text-[10px] text-muted-foreground">
              {formatCurrency(earnings.amount, earnings.currency)}
            </div>
          )}
        </div>
      )}

      {entry && entry.status !== 'worked' && (
        <div className="mt-auto text-[10px] font-semibold text-muted-foreground">
          {STATUS_LABELS[entry.status]}
        </div>
      )}
    </button>
  )

  if (entry?.notes) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{dayContent}</TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs">{entry.notes}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return dayContent
}
