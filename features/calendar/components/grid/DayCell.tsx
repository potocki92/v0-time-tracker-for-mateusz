import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { Client, WorkEntry } from '@/lib/types'
import { formatCurrency, getDateString, isFutureDate } from '@/lib/helpers'
import { calculateEarnings } from '@/lib/finance/earnings'
import { cn } from '@/lib/utils'
import { STATUS_CONFIG } from '../../domain/calendar.constants'
import type { WorkStatus } from '../../domain/calendar.types'
import type { TripDayMarker } from '../../domain/calendar.selectors'
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
  tripMarker?: TripDayMarker
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
  tripMarker,
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

  const tripRounding = tripMarker
    ? cn(
        tripMarker.roundLeft ? 'rounded-l-lg' : 'rounded-l-none',
        tripMarker.roundRight ? 'rounded-r-lg' : 'rounded-r-none',
      )
    : 'rounded-lg'

  const cellButton = (
    <button
      onClick={() => onClick(day)}
      // Stabilny uchwyt dla E2E: aria-label komorki zmienia sie razem ze
      // statusem wpisu i markerem wyjazdu, wiec "komorka dnia X" nie ma
      // niezmiennej nazwy dostepnosciowej, po ktorej dalo by sie ja wskazac.
      data-testid={`day-cell-${dateStr}`}
      aria-label={`Dzień ${day}${entry ? `, ${cfg?.label}` : ''}${
        tripMarker ? `, wyjazd${tripMarker.destination ? ` ${tripMarker.destination}` : ''}` : ''
      }`}
      className={cn(
        'group relative isolate flex h-16 w-full flex-col overflow-hidden border bg-surface-1 p-1.5 text-left sm:h-24 sm:p-2',
        tripRounding,
        'transition-all duration-200 motion-reduce:transition-none',
        entry
          ? `border-l-[3px] ${cfg?.border} border-y border-r border-hairline ${cfg?.bg}`
          : 'border-hairline hover:border-hairline-strong hover:bg-surface-2',
        isToday &&
          'border-emerald-500/60 ring-2 ring-emerald-500/40 ring-offset-1 ring-offset-black shadow-[0_0_0_1px_#22c55e] before:absolute before:inset-0 before:rounded-[inherit] before:bg-emerald-500/5 before:pointer-events-none',
        isWeekend && !entry && 'bg-surface-2',
        'cursor-pointer hover:shadow-sm hover:-translate-y-px active:scale-[0.97]',
        isFuture && 'opacity-80',
      )}
    >
      {tripMarker && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-emerald-500/15 dark:bg-emerald-500/[0.10]"
        />
      )}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-2xs font-semibold leading-none transition-colors sm:text-xs',
            isToday
              ? 'flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-2xs text-black shadow-sm shadow-emerald-500/40'
              : 'text-zinc-400 group-hover:text-white',
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
          <div className="text-2xs font-bold leading-none text-white">
            {client?.work_type === 'hourly'
              ? `${entry.hours}h`
              : `${entry.quantity} ${client?.unit ?? ''}`}
          </div>
          {earnings && earnings.amount > 0 && (
            <div className="truncate text-2xs font-medium leading-none text-zinc-400">
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
            'mt-auto w-fit rounded px-1 py-0.5 text-2xs font-bold uppercase tracking-wider leading-none',
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
