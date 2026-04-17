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
  onClick: (day: number) => void
}

/**
 * Pojedyncza komórka kalendarza — adaptuje się do mobile (h-16) i desktop (h-24).
 * Pokazuje dzień, kolorowy marker statusu, godziny/kwotę + hover-tooltip na desktopie.
 */
export function DayCell({ day, month, year, entry, clients, eurToPln, onClick }: Props) {
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
        'group relative h-16 sm:h-24 w-full rounded-lg border bg-card text-left',
        'flex flex-col p-1.5 sm:p-2 overflow-hidden transition-all duration-150',
        entry
          ? `border-l-[3px] ${cfg?.border} border-t border-r border-b border-border/50 ${cfg?.bg}`
          : 'border-border/50 hover:border-border hover:bg-muted/40',
        isToday && 'ring-2 ring-primary/40 ring-offset-1 ring-offset-background',
        isFuture
          ? 'cursor-not-allowed opacity-40 bg-muted/20'
          : 'cursor-pointer hover:shadow-sm active:scale-[0.97]',
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-[11px] sm:text-xs font-semibold leading-none transition-colors',
            isToday
              ? 'flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]'
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
        <div className="mt-auto space-y-0.5">
          <div className="text-[10px] sm:text-[11px] font-bold leading-none text-foreground">
            {client?.work_type === 'hourly'
              ? `${entry.hours}h`
              : `${entry.quantity} ${client?.unit ?? ''}`}
          </div>
          {earnings && earnings.amount > 0 && (
            <div className="text-[9px] sm:text-[10px] font-medium leading-none text-muted-foreground truncate">
              {formatCurrency(earnings.amount, earnings.currency)}
            </div>
          )}
          {client && (
            <div
              className="absolute bottom-0 left-0 right-0 h-[2px] opacity-60"
              style={{ background: stringToColor(client.name) }}
              aria-hidden
            />
          )}
        </div>
      )}

      {entry && entry.status !== 'worked' && (
        <div
          className={cn(
            'mt-auto rounded px-1 py-0.5 text-[8px] sm:text-[9px] font-semibold uppercase tracking-wide leading-none w-fit',
            cfg?.pill,
          )}
        >
          {cfg?.label}
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
          className="w-56 p-0 overflow-hidden border-border/80 shadow-xl"
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
