'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import { getDateRange, getPrevRange } from '@/lib/date/dateRange'
import type { DateRange } from '@/lib/date/dateRange'
import type { TimeRange } from '../../_domain/dashboard.types'

type Ctx = {
  range: TimeRange
  setRange: (r: TimeRange) => void
  dateRange: DateRange
  prevRange: DateRange
}

const DashboardRangeContext = createContext<Ctx | null>(null)

export function DashboardRangeProvider({
  defaultRange = 'current_week',
  children,
}: {
  defaultRange?: TimeRange
  children: React.ReactNode
}) {
  const [range, setRange] = useState<TimeRange>(defaultRange)

  const value = useMemo<Ctx>(() => {
    const dateRange = getDateRange(range)
    return {
      range,
      setRange,
      dateRange,
      prevRange: getPrevRange(dateRange),
    }
  }, [range])

  return (
    <DashboardRangeContext.Provider value={value}>
      {children}
    </DashboardRangeContext.Provider>
  )
}

export function useDashboardRange() {
  const ctx = useContext(DashboardRangeContext)
  if (!ctx) {
    throw new Error('useDashboardRange must be used inside DashboardRangeProvider')
  }
  return ctx
}
