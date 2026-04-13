import { useMemo } from 'react'
import { WorkEntry } from '@/lib/types'

type DateRange = { from: Date | null; to: Date | null }

/**
 * Filtruje wpisy do podanego zakresu dat.
 *
 * WAŻNE — stabilność `dateRange`:
 * Przekazuj `dateRange` z `useDateRange()` — ma stabilną referencję (useMemo).
 * Inline `{ from: new Date(), to: new Date() }` → nowy obiekt przy każdym
 * renderze rodzica → useFilteredEntries rekalkuluje mimo tych samych dat.
 */
export function useFilteredEntries(entries: WorkEntry[], dateRange: DateRange): WorkEntry[] {
  return useMemo(() => {
    const { from, to } = dateRange
    if (!from || !to) return entries

    // Normalizujemy granice do początku/końca dnia.
    // Bez tego wpis z datą "2024-01-31" (czas 00:00) mógłby wypaść poza zakres
    // gdy `to` ma godzinę inną niż 23:59.
    const fromMs = new Date(from).setHours(0, 0, 0, 0)
    const toMs   = new Date(to).setHours(23, 59, 59, 999)

    return entries.filter((e) => {
      const d = new Date(e.date).getTime()
      return d >= fromMs && d <= toMs
    })
  }, [entries, dateRange])
}