import { Badge } from '@/components/ui/badge'
import { Clock, Layers } from 'lucide-react'
import { formatDayBadge } from '@/lib/format'
import type { Client, WorkEntry } from '@/lib/types'
import { cn } from '@/lib/utils'
import { STATUS_CONFIG } from '../../domain/calendar.constants'
import type { WorkStatus } from '../../domain/calendar.types'
import { stringToColor } from '../grid/clientColor'

interface Props {
  entry: WorkEntry
  client?: Client
  onClick?: (entry: WorkEntry) => void
}

/**
 * Pojedynczy wiersz/lista karta na mobilnych urządzeniach.
 * Kompaktowy layout, tap-friendly target (min-h-[56px]).
 */
export function CalendarListRow({ entry, client, onClick }: Props) {
  const cfg = STATUS_CONFIG[entry.status as WorkStatus]
  const badge = formatDayBadge(entry.date)

  const quantityLabel =
    entry.status === 'worked' && client
      ? client.work_type === 'hourly'
        ? `${entry.hours ?? 0}h`
        : `${entry.quantity ?? 0} ${client.unit ?? ''}`
      : null

  return (
    <button
      type="button"
      onClick={() => onClick?.(entry)}
      className={cn(
        'group flex w-full items-center gap-3 rounded-lg border border-hairline bg-surface-1 p-3 text-left',
        'transition-all hover:border-hairline-strong hover:shadow-sm active:scale-[0.99]',
      )}
    >
      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-2">
        <span className="text-2xs font-medium uppercase tracking-widest text-zinc-400">
          {badge.month}
        </span>
        <span className="text-sm font-bold leading-none text-white">{badge.day}</span>
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className={cn('text-2xs font-medium px-1.5 py-0 border', cfg?.badge)}>
            {cfg?.label}
          </Badge>
          {quantityLabel && (
            <span className="inline-flex items-center gap-1 text-2xs font-semibold text-white">
              {client?.work_type === 'hourly' ? (
                <Clock className="h-3 w-3 text-zinc-400" />
              ) : (
                <Layers className="h-3 w-3 text-zinc-400" />
              )}
              {quantityLabel}
            </span>
          )}
        </div>

        {client && (
          <div className="flex items-center gap-1.5">
            <div
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-2xs font-bold text-white"
              style={{ background: stringToColor(client.name) }}
              aria-hidden
            >
              {client.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="truncate text-2xs text-zinc-400">{client.name}</span>
          </div>
        )}

        {entry.notes && (
          <p className="line-clamp-1 text-2xs text-zinc-400">{entry.notes}</p>
        )}
      </div>
    </button>
  )
}
