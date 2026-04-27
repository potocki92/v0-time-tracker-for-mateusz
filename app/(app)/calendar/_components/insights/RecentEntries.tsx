'use client'

import { ArrowUpRight, ClipboardList } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/helpers'
import { DAY_NAMES } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { RecentEntry } from '../../_domain/calendar.types'

interface Props {
  entries: RecentEntry[]
  onViewAll?: () => void
}

const MONTH_SHORT = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']

export function RecentEntries({ entries, onViewAll }: Props) {
  return (
    <Card className="border-border/60 py-0 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <header className="flex items-center justify-between">
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Ostatnie wpisy
            </h3>
            <p className="text-[10px] text-muted-foreground/70">Ostatnie 7 wpisów</p>
          </div>
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className={cn(
                'group inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-primary',
                'transition-colors hover:bg-primary/10 focus-visible:bg-primary/10',
              )}
            >
              Zobacz wszystkie
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          )}
        </header>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-8 text-center">
            <ClipboardList className="h-6 w-6 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">Brak ostatnich wpisów</p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-border/50">
            {entries.map((entry) => (
              <RecentRow key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function RecentRow({ entry }: { entry: RecentEntry }) {
  const [y, m, d] = entry.date.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const dow = (date.getDay() + 6) % 7 // Pn = 0
  const dayLabel = DAY_NAMES[dow]
  const monthLabel = MONTH_SHORT[m - 1]
  const amountStr =
    entry.currency === 'PLN'
      ? formatCurrency(entry.amountPLN, 'PLN')
      : `${formatCurrency(entry.amountNative, entry.currency)} · ${formatCurrency(entry.amountPLN, 'PLN')}`

  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="flex h-9 w-12 shrink-0 flex-col items-center justify-center rounded-md border border-border/50 bg-muted/40">
        <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
          {monthLabel} · {dayLabel}
        </span>
        <span className="text-[12px] font-bold leading-none text-foreground">{d}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium text-foreground">
          {entry.clientName ?? 'Bez klienta'}
        </div>
        {entry.notes ? (
          <p className="line-clamp-1 text-[11px] text-muted-foreground/80">{entry.notes}</p>
        ) : (
          <p className="text-[11px] text-muted-foreground/50 italic">brak notatki</p>
        )}
      </div>

      <div className="shrink-0 text-right">
        <div className="text-xs font-semibold tabular-nums text-foreground">
          {entry.hours.toFixed(1)}h
        </div>
        <div className="text-[10px] tabular-nums text-muted-foreground">{amountStr}</div>
      </div>
    </li>
  )
}
