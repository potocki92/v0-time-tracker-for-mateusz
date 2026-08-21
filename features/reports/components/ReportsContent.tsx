'use client'

import { useMemo } from 'react'
import { useDashboardData } from '@/features/dashboard'
import {
  uniqueTags,
  useReportsAnalytics,
  useReportsExport,
  useReportsFilters,
} from '../hooks'
import { ReportsHeader } from './ReportsHeader'
import { ReportsFilters } from './ReportsFilters'
import { ReportsKpis } from './ReportsKpis'
import { ReportsBreakdown } from './ReportsBreakdown'

function countActiveFilters(f: {
  preset: string
  clientId: string
  projectId: string
  tag: string
}): number {
  let n = 0
  if (f.preset    !== '30d') n += 1
  if (f.clientId  !== 'all') n += 1
  if (f.projectId !== 'all') n += 1
  if (f.tag       !== 'all') n += 1
  return n
}

export function ReportsContent() {
  const { data } = useDashboardData()
  const { workEntries, clients, projects } = data

  const filtersState = useReportsFilters()
  const tags = useMemo(() => uniqueTags(workEntries), [workEntries])

  const summary = useReportsAnalytics({
    workEntries,
    clients,
    projects,
    filters: filtersState.filters,
    today:   filtersState.today,
  })

  const { exportCsv, exportJson } = useReportsExport({
    workEntries,
    clients,
    projects,
    filters: filtersState.filters,
    today:   filtersState.today,
  })

  const activeCount = countActiveFilters(filtersState.filters)

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <div className="mx-auto w-full max-w-2xl space-y-5 px-3 pb-28 pt-2 sm:px-4 md:max-w-5xl md:px-6 md:pb-10 md:pt-3 lg:px-8">
        <ReportsHeader
          rangeLabel={summary.range.label}
          onExportCsv={exportCsv}
          onExportJson={exportJson}
        />

        <ReportsFilters
          filters={filtersState.filters}
          clients={clients}
          projects={projects}
          tags={tags}
          activeCount={activeCount}
          onPresetChange={filtersState.setPreset}
          onFromChange={filtersState.setFrom}
          onToChange={filtersState.setTo}
          onClientChange={filtersState.setClientId}
          onProjectChange={filtersState.setProjectId}
          onTagChange={filtersState.setTag}
          onToggleCompare={filtersState.toggleCompare}
          onReset={filtersState.resetFilters}
        />

        <ReportsKpis summary={summary} compareOn={filtersState.filters.compare} />

        <ReportsBreakdown items={summary.projectUsage} />
      </div>
    </div>
  )
}
