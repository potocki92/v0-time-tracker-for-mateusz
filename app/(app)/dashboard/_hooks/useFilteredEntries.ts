import { useMemo } from 'react'
import { WorkEntry } from '@/lib/types'

type DateRange = { from: Date | null; to: Date | null }

export function useFilteredEntries(entries: WorkEntry[], dateRange: DateRange): WorkEntry[] {
  return useMemo(() => {
    return entries.filter((e) => {
      if (!dateRange.from || !dateRange.to) return true
      const d = new Date(e.date)
      return d >= dateRange.from! && d <= dateRange.to!
    })
  }, [entries, dateRange])
}
