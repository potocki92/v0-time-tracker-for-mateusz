import { CalendarDays, Clock, Banknote, FileText, Layers } from 'lucide-react'
import type { Client, CURRENCY, WorkEntry } from '@/lib/types'
import { formatDate, formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { STATUS_CONFIG } from '../../domain/calendar.constants'
import type { WorkStatus } from '../../domain/calendar.types'
import { stringToColor } from './clientColor'

type Earnings = { amount: number; currency: string; amountInPLN: number } | null

interface Props {
  entry: WorkEntry
  client?: Client
  earnings: Earnings
}

export function DayCellTooltip({ entry, client, earnings }: Props) {
  const cfg = STATUS_CONFIG[entry.status as WorkStatus]

  return (
    <div className="text-xs">
      <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2">
        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="font-medium text-foreground">
          {formatDate(entry.date, 'long')}
        </span>
        <span className={cn('ml-auto rounded px-1.5 py-0.5 text-2xs font-semibold', cfg?.pill)}>
          {cfg?.label}
        </span>
      </div>

      <div className="space-y-2 px-3 py-2.5">
        {client && (
          <div className="flex items-center gap-2">
            <div
              className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-2xs font-bold text-white ring-2 ring-background"
              style={{ background: stringToColor(client.name) }}
            >
              {client.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{client.name}</p>
              <p className="text-2xs text-muted-foreground">
                {client.rate} {client.currency}/{client.work_type === 'hourly' ? 'h' : client.unit}
              </p>
            </div>
          </div>
        )}

        {entry.status === 'worked' && client?.work_type === 'hourly' && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            <span>
              <span className="font-semibold text-foreground">{entry.hours}h</span> przepracowane
            </span>
          </div>
        )}

        {entry.status === 'worked' && client?.work_type === 'piecework' && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="h-3 w-3 shrink-0" />
            <span>
              <span className="font-semibold text-foreground">
                {entry.quantity} {client.unit}
              </span>
              {entry.quantity_from != null && entry.quantity_to != null && (
                <span className="text-2xs">
                  {' '}
                  ({entry.quantity_from} → {entry.quantity_to})
                </span>
              )}
            </span>
          </div>
        )}

        {earnings && earnings.amount > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Banknote className="h-3 w-3 shrink-0" />
            <span>
              <span className="font-semibold text-foreground">
                {formatMoney(
                  Math.round(earnings.amount * 100),
                  earnings.currency as CURRENCY,
                )}
              </span>
              {earnings.currency !== 'PLN' && (
                <span className="text-2xs text-muted-foreground ml-1">
                  ≈ {formatMoney(Math.round(earnings.amountInPLN * 100), 'PLN')}
                </span>
              )}
            </span>
          </div>
        )}

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
