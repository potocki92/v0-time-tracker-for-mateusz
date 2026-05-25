import { List } from 'lucide-react'

export function EmptyList() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-sm text-zinc-500">
      <List className="h-8 w-8 opacity-20" />
      <p>Brak wpisów w tym miesiącu</p>
      <p className="text-xs text-zinc-600">
        Kliknij dzień w kalendarzu, żeby dodać pierwszy wpis.
      </p>
    </div>
  )
}
