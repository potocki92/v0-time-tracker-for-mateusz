import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { Client, WorkEntry } from '@/lib/types'
import { CalendarListRow } from './CalendarListRow'
import { EmptyList } from './EmptyList'

interface Props {
  entries: WorkEntry[]
  clients: Client[]
  onSelectEntry?: (entry: WorkEntry) => void
}

/**
 * Lista wpisów miesiąca — pojedynczy wariant dla wszystkich rozdzielczości.
 * Na mobile pełnoszerokościowe karty, na desktopie wielokolumnowy grid.
 */
export function CalendarList({ entries, clients, onSelectEntry }: Props) {
  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients],
  )

  const sorted = useMemo(
    () =>
      [...entries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [entries],
  )

  if (sorted.length === 0) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-0">
          <EmptyList />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((entry) => (
        <CalendarListRow
          key={entry.id}
          entry={entry}
          client={entry.client_id ? clientMap.get(entry.client_id) : undefined}
          onClick={onSelectEntry}
        />
      ))}
    </div>
  )
}
