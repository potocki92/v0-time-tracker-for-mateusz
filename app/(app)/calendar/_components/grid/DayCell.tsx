import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { Client, WorkEntry } from '@/lib/types'
import { formatCurrency, getDateString, isFutureDate } from '@/lib/helpers'
import { calculateEarnings } from '@/lib/finance/earnings'
import { cn } from '@/lib/utils'
import { STATUS_CONFIG } from '../../_domain/calendar.constants'
import type { WorkStatus } from '../../_domain/calendar.types'
import { DayCellTooltip } from './DayCellTooltip'
import { stringToColor } from './clientColor'

interface Props {
  day: number
  month: number
  year: number
  entry?: WorkEntry
  clients: Client[]
  eurToPln: number
  isWeekend?: boolean
  onClick: (day: number) => void
}

const SHORT_LABEL: Record<WorkStatus, string> = {
  worked: '',
  not_worked: 'OFF',
  vacation: 'PTO',
  sick_leave: 'L4',
  day_off: 'OFF',
}

/**
 * Pojedyncza komórka kalendarza. Adaptuje się do mobile (h-16) i desktop (h-24).
 * "Glow" na dzisiejszym dniu, krótki tag (OFF/PTO/L4) zamiast pełnej etykiety,
 * delikatne podkreślenie kolorem klienta na dole. Hover-tooltip tylko na desktopie.
 */
export function DayCell({
  day,
  month,
  year,
  entry,
  clients,
  eurToPln,
  isWeekend,
  onClick,
}: Props) {
  const dateStr = getDateString(year, month, day)
  const today = new Date()
  const todayStr = getDateString(today.getFullYear(), today.getMonth(), today.getDate())
  const isToday = todayStr === dateStr
  const isFuture = isFutureDate(dateStr)

  const client = entry?.client_id ? clients.find((c) => c.id === entry.client_id) : undefined
  const earnings = entry && client ? calculateEarnings(entry, client, eurToPln) : null
  const cfg = entry ? STATUS_CONFIG[entry.status as WorkStatus] : null

  const cellButton = (
    <button
      disabled={isFuture}
      onClick={() => onClick(day)}
      aria-label={`Dzień ${day}${entry ? `, ${cfg?.label}` : ''}`}
      className={cn(
        'group relative flex h-16 w-full flex-col overflow-hidden rounded-lg border bg-card p-1.5 text-left sm:h-24 sm:p-2',
        'transition-all duration-200 motion-reduce:transition-none',
        entry
          ? `border-l-[3px] ${cfg?.border} border-y border-r border-border/50 ${cfg?.bg}`
          : 'border-border/50 hover:border-border/80 hover:bg-muted/40',
        isToday &&
          'border-primary/60 ring-2 ring-primary/40 ring-offset-1 ring-offset-background shadow-[0_0_0_1px_var(--primary)] before:absolute before:inset-0 before:rounded-lg before:bg-primary/5 before:pointer-events-none',
        isWeekend && !entry && 'bg-muted/30',
        isFuture
          ? 'cursor-not-allowed opacity-40'
          : 'cursor-pointer hover:shadow-sm hover:-translate-y-px active:scale-[0.97]',
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-[11px] font-semibold leading-none transition-colors sm:text-xs',
            isToday
              ? 'flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground shadow-sm shadow-primary/40'
              : 'text-foreground/70 group-hover:text-foreground',
          )}
        >
          {day}
        </span>

        {entry && entry.status !== 'worked' && cfg && (
          <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} aria-hidden />
        )}
      </div>

      {entry?.status === 'worked' && (
        <div className="relative mt-auto space-y-0.5">
          <div className="text-[10px] font-bold leading-none text-foreground sm:text-[11px]">
            {client?.work_type === 'hourly'
              ? `${entry.hours}h`
              : `${entry.quantity} ${client?.unit ?? ''}`}
          </div>
          {earnings && earnings.amount > 0 && (
            <div className="truncate text-[9px] font-medium leading-none text-muted-foreground sm:text-[10px]">
              {formatCurrency(earnings.amount, earnings.currency)}
            </div>
          )}
          {client && (
            <div
              className="absolute -bottom-1.5 left-0 right-0 h-[2px] opacity-70 sm:-bottom-2"
              style={{ background: stringToColor(client.name) }}
              aria-hidden
            />
          )}
        </div>
      )}

      {entry && entry.status !== 'worked' && (
        <div
          className={cn(
            'mt-auto w-fit rounded px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider leading-none sm:text-[9px]',
            cfg?.pill,
          )}
        >
          {SHORT_LABEL[entry.status as WorkStatus] || cfg?.label}
        </div>
      )}
    </button>
  )

  if (!entry || isFuture) return cellButton

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{cellButton}</TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          className="w-56 overflow-hidden border-border/80 p-0 shadow-xl"
          sideOffset={6}
        >
          <DayCellTooltip
            entry={entry}
            client={client}
            earnings={earnings}
            day={day}
            month={month}
            year={year}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
