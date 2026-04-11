import { useMemo } from 'react'
import { getDateRange } from '@/lib/date/dateRange'
import { WorkEntry } from '@/lib/types'
import { TimeRange } from '../_domain/dashboard.types'

export function useFilteredEntries(entries: WorkEntry[], range: TimeRange): WorkEntry[]{
  return useMemo(() => {
    const r = getDateRange(range)
    return entries.filter((e) => {
      if (!r.from || !r.to) return true
      const d = new Date(e.date)
      return d >= r.from && d <= r.to
    })
  }, [entries, range])
}