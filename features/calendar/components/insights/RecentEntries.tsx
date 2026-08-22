'use client'

import { Button } from '@/components/ui/button'
import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import { ArrowUpRight, ClipboardList } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatDayBadge, formatHours, formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { RecentEntry } from '../../domain/calendar.types'

interface Props {
  entries: RecentEntry[]
  onViewAll?: () => void
}

export function RecentEntries({ entries, onViewAll }: Props) {
  return (
    <Card className="rounded-lg border-hairline bg-surface-1 py-0 shadow-none">
      <CardContent className="p-4 sm:p-5">
        <header className="flex items-center justify-between">
          <div>
            <SectionEyebrow as="h3">Ostatnie wpisy</SectionEyebrow>
            <p className="text-2xs text-zinc-400">Ostatnie 7 wpisów</p>
          </div>
          {onViewAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className={cn(
                'group h-auto gap-1 rounded-md px-2 py-1 text-2xs font-medium text-emerald-400',
                'hover:bg-emerald-500/10 hover:text-emerald-400 focus-visible:bg-emerald-500/10',
              )}
            >
              Zobacz wszystkie
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          )}
        </header>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-8 text-center">
            <ClipboardList className="h-6 w-6 text-zinc-700" />
            <p className="text-xs text-zinc-400">Brak ostatnich wpisów</p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-hairline">
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
  const badge = formatDayBadge(entry.date)
  const amountStr =
    entry.currency === 'PLN'
      ? formatMoney(entry.amountMinorPLN, 'PLN')
      : `${formatMoney(entry.amountMinorNative, entry.currency)} · ${formatMoney(entry.amountMinorPLN, 'PLN')}`

  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="flex h-9 w-12 shrink-0 flex-col items-center justify-center rounded-md border border-hairline bg-surface-2">
        <span className="text-2xs font-bold uppercase tracking-wider text-zinc-400">
          {badge.month} · {badge.weekday}
        </span>
        <span className="text-xs font-bold leading-none text-white">{badge.day}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium text-white">
          {entry.clientName ?? 'Bez klienta'}
        </div>
        {entry.notes ? (
          <p className="line-clamp-1 text-2xs text-zinc-400">{entry.notes}</p>
        ) : (
          <p className="text-2xs text-zinc-400 italic">brak notatki</p>
        )}
      </div>

      <div className="shrink-0 text-right">
        <div className="text-xs font-semibold tabular-nums text-white">
          {formatHours(entry.hours)}
        </div>
        <div className="text-2xs tabular-nums text-zinc-400">{amountStr}</div>
      </div>
    </li>
  )
}
