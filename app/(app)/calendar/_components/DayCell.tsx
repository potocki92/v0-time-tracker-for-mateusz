import type { Client, WorkEntry } from '@/lib/types'
import { calculateEarnings, formatCurrency, getDateString, isFutureDate } from '@/lib/helpers'
import { STATUS_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Clock, Banknote, CalendarDays, FileText, Layers } from 'lucide-react'

// ─── Status visual config ──────────────────────────────────────────────────
const STATUS_CONFIG = {
  worked: {
    border: 'border-l-emerald-500',
    bg: 'hover:bg-emerald-500/5',
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  vacation: {
    border: 'border-l-violet-500',
    bg: 'hover:bg-violet-500/5',
    dot: 'bg-violet-500',
    pill: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  },
  sick_leave: {
    border: 'border-l-amber-500',
    bg: 'hover:bg-amber-500/5',
    dot: 'bg-amber-500',
    pill: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  },
  day_off: {
    border: 'border-l-slate-400',
    bg: 'hover:bg-slate-500/5',
    dot: 'bg-slate-400',
    pill: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  },
  not_worked: {
    border: 'border-l-rose-500',
    bg: 'hover:bg-rose-500/5',
    dot: 'bg-rose-500',
    pill: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
  },
} as const

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
  const today = new Date()
  const todayStr = getDateString(today.getFullYear(), today.getMonth(), today.getDate())
  const isToday = todayStr === dateStr
  const isFuture = isFutureDate(dateStr)

  const client = entry?.client_id ? clients.find((c) => c.id === entry.client_id) : undefined
  const earnings = entry && client ? calculateEarnings(entry, client, eurToPln) : null
  const cfg = entry ? STATUS_CONFIG[entry.status as keyof typeof STATUS_CONFIG] : null

  const cellButton = (
    <button
      disabled={isFuture}
      onClick={() => onClick(day)}
      className={cn(
        // Base
        'group relative h-20 sm:h-24 w-full rounded-lg border bg-card text-left',
        'flex flex-col p-2 overflow-hidden transition-all duration-150',
        // Entry state
        entry
          ? `border-l-[3px] ${cfg?.border} border-t border-r border-b border-border/50 ${cfg?.bg}`
          : 'border-border/50 hover:border-border hover:bg-muted/40',
        // Today ring
        isToday && 'ring-2 ring-primary/40 ring-offset-1 ring-offset-background',
        // Future
        isFuture
          ? 'cursor-not-allowed opacity-40 bg-muted/20'
          : 'cursor-pointer hover:shadow-md active:scale-[0.97]',
      )}
    >
      {/* Day number */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-xs font-semibold leading-none transition-colors',
            isToday
              ? 'flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]'
              : 'text-foreground/70 group-hover:text-foreground',
          )}
        >
          {day}
        </span>

        {/* Status dot for non-worked entries */}
        {entry && entry.status !== 'worked' && cfg && (
          <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
        )}
      </div>

      {/* Worked entry: hours + earnings */}
      {entry?.status === 'worked' && (
        <div className="mt-auto space-y-0.5">
          <div className="text-[11px] font-bold leading-none text-foreground">
            {client?.work_type === 'hourly'
              ? `${entry.hours}h`
              : `${entry.quantity} ${client?.unit ?? ''}`}
          </div>
          {earnings && earnings.amount > 0 && (
            <div className="text-[10px] font-medium leading-none text-muted-foreground truncate">
              {formatCurrency(earnings.amount, earnings.currency)}
            </div>
          )}
          {/* Client color strip */}
          {client && (
            <div
              className="absolute bottom-0 left-0 right-0 h-[2px] opacity-60"
              style={{ background: stringToColor(client.name) }}
            />
          )}
        </div>
      )}

      {/* Non-worked label */}
      {entry && entry.status !== 'worked' && (
        <div className={cn('mt-auto rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide leading-none w-fit', cfg?.pill)}>
          {STATUS_LABELS[entry.status]}
        </div>
      )}
    </button>
  )

  // Only show tooltip if there's meaningful data
  const hasTooltip = !isFuture && entry

  if (!hasTooltip) return cellButton

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
            entry={entry!}
            client={client}
            earnings={earnings}
            dateStr={dateStr}
            day={day}
            month={month}
            year={year}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ─── Rich tooltip content ──────────────────────────────────────────────────
interface TooltipProps {
  entry: WorkEntry
  client?: Client
  earnings: { amount: number; currency: string; amountInPLN: number } | null
  dateStr: string
  day: number
  month: number
  year: number
}

function DayCellTooltip({ entry, client, earnings, dateStr, day, month, year }: TooltipProps) {
  const cfg = STATUS_CONFIG[entry.status as keyof typeof STATUS_CONFIG]
  const MONTH_ABBR = ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru']

  return (
    <div className="text-xs">
      {/* Header */}
      <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2">
        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="font-medium text-foreground">
          {day} {MONTH_ABBR[month]} {year}
        </span>
        <span className={cn('ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold', cfg?.pill)}>
          {STATUS_LABELS[entry.status]}
        </span>
      </div>

      <div className="space-y-2 px-3 py-2.5">
        {/* Client with avatar */}
        {client && (
          <div className="flex items-center gap-2">
            <div
              className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-background"
              style={{ background: stringToColor(client.name) }}
            >
              {client.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{client.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {client.rate} {client.currency}/{client.work_type === 'hourly' ? 'h' : client.unit}
              </p>
            </div>
          </div>
        )}

        {/* Hours */}
        {entry.status === 'worked' && client?.work_type === 'hourly' && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            <span>
              <span className="font-semibold text-foreground">{entry.hours}h</span> przepracowane
            </span>
          </div>
        )}

        {/* Quantity / piecework */}
        {entry.status === 'worked' && client?.work_type === 'piecework' && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="h-3 w-3 shrink-0" />
            <span>
              <span className="font-semibold text-foreground">{entry.quantity} {client.unit}</span>
              {entry.quantity_from != null && entry.quantity_to != null && (
                <span className="text-[10px]"> ({entry.quantity_from} → {entry.quantity_to})</span>
              )}
            </span>
          </div>
        )}

        {/* Earnings */}
        {earnings && earnings.amount > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Banknote className="h-3 w-3 shrink-0" />
            <span>
              <span className="font-semibold text-foreground">
                {formatCurrency(earnings.amount, earnings.currency)}
              </span>
              {earnings.currency !== 'PLN' && (
                <span className="text-[10px] text-muted-foreground ml-1">
                  ≈ {formatCurrency(earnings.amountInPLN, 'PLN')}
                </span>
              )}
            </span>
          </div>
        )}

        {/* Notes */}
        {entry.notes && (
          <div className="flex gap-2 border-t pt-2 text-muted-foreground">
            <FileText className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="line-clamp-3 leading-relaxed">{entry.notes}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Utility ──────────────────────────────────────────────────────────────
function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 55%, 48%)`
}