'use client'

import { useMemo } from 'react'
import type { Client, Project, WorkEntry } from '@/lib/types'
import { computeReportSummary, todayKey } from '../lib/analytics'
import type { ReportSummary, ReportsFilters } from '../lib/types'
import type { DateKey } from '../lib/date-keys'

type Params = {
  workEntries: WorkEntry[]
  clients:     Client[]
  projects:    Project[]
  filters:     ReportsFilters
  today:       DateKey | null
}

export function useReportsAnalytics({
  workEntries,
  clients,
  projects,
  filters,
  today,
}: Params): ReportSummary {
  return useMemo(
    () => computeReportSummary(workEntries, clients, projects, filters, today ?? todayKey()),
    [workEntries, clients, projects, filters, today],
  )
}
