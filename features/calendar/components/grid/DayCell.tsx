import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { Client, WorkEntry } from '@/lib/types'
import { toMinor } from '@/lib/format'
import { useFormat } from '@/lib/format/client'
import { getDateString, isFutureDate } from '@/lib/helpers'
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
 * Wyróżnienie dzisiejszego dnia idzie WYŁĄCZNIE do wnętrza komórki (ring-inset
 * + pigułka z numerem): pierścień z `ring-offset` rósł na zewnątrz i przy
 * `gap-1` nachodził na sąsiadów, przez co dzisiejsza kolumna wyglądała na
 * przesuniętą.
 *
 * Na wąskim ekranie komórka ma ~32 px treści — kwota nie ma tam szans i lądowała
 * jako "1 00…". Do `md` pokazujemy więc same godziny, a kwota wraca wtedy, gdy
 * jest dla niej miejsce; pełne dane i tak są w dialogu dnia i w widoku listy.
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
  const fmt = useFormat()
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
        'group relative isolate flex h-16 w-full flex-col overflow-hidden border bg-surface-1 p-1 text-left sm:h-24 sm:p-2',
        tripRounding,
        'transition-all duration-200 motion-reduce:transition-none',
        entry
          ? `border-l-[3px] ${cfg?.border} border-y border-r border-hairline ${cfg?.bg}`
          : 'border-hairline hover:border-hairline-strong hover:bg-surface-2',
        isToday &&
          'ring-1 ring-inset ring-brand-500/60 before:absolute before:inset-0 before:-z-10 before:bg-brand-500/[0.07] before:pointer-events-none',
        isWeekend && !entry && 'bg-surface-2',
        'cursor-pointer hover:shadow-sm hover:-translate-y-px active:scale-[0.97]',
        isFuture && 'opacity-80',
      )}
    >
      {tripMarker && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-brand-500/15 dark:bg-brand-500/[0.10]"
        />
      )}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-2xs font-semibold leading-none transition-colors sm:text-xs',
            isToday
              ? 'flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-2xs text-brand-foreground shadow-sm shadow-brand-500/40'
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
        <div className="mt-auto min-w-0 space-y-0.5">
          <div className="truncate text-2xs font-bold leading-none text-white">
            {client?.work_type === 'hourly'
              ? fmt.hours(entry.hours)
              : `${fmt.number(entry.quantity)} ${client?.unit ?? ''}`.trim()}
          </div>
          {earnings && earnings.amount > 0 && (
            <div className="hidden truncate text-2xs font-medium leading-none text-zinc-400 md:block">
              {fmt.money(toMinor(earnings.amount), earnings.currency)}
            </div>
          )}
        </div>
      )}

      {/* Pasek klienta idzie przez całą szerokość komórki — wersja wpisana
          w padding kończyła się 6 px przed jej krawędziami i czytała się
          jak artefakt renderowania, a nie jak akcent. */}
      {entry?.status === 'worked' && client && (
        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] opacity-80"
          style={{ background: stringToColor(client.name) }}
          aria-hidden
        />
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
          <DayCellTooltip entry={entry} client={client} earnings={earnings} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
