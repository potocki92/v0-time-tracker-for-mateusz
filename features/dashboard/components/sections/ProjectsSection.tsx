'use client'

import { useMemo } from 'react'
import { useDashboardData } from '../../hooks'
import { useFilteredEntries } from '../../hooks/useFilteredEntries'
import { ProjectsCard, type ProjectItem, type ProjectStatus } from './linear'
import { useDashboardRange } from './DashboardRangeContext'

const STATUS_PALETTE = ['#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b']

export function ProjectsSection() {
  const { data } = useDashboardData()
  const { dateRange } = useDashboardRange()
  const filtered = useFilteredEntries(data.workEntries, dateRange)

  const projects = useMemo<ProjectItem[]>(() => {
    // The data model doesn't expose explicit projects. We approximate
    // them from work entries grouped by project_id (label = notes / client name).
    const clientMap = new Map(data.clients.map((c) => [c.id, c]))
    type Acc = {
      id: string
      name: string
      hours: number
      lastDate: string
      clientId: string | null
    }
    const map = new Map<string, Acc>()

    for (const e of data.workEntries) {
      const id = e.project_id ?? e.notes ?? e.client_id
      if (!id) continue
      const acc = map.get(id) ?? {
        id,
        name: e.notes ?? clientMap.get(e.client_id ?? '')?.name ?? 'Untitled',
        hours: 0,
        lastDate: '',
        clientId: e.client_id,
      }
      acc.hours += e.hours ?? 0
      if (e.date > acc.lastDate) acc.lastDate = e.date
      map.set(id, acc)
    }

    const filteredIds = new Set(
      filtered
        .map((e) => e.project_id ?? e.notes ?? e.client_id)
        .filter(Boolean) as string[],
    )

    const rows = Array.from(map.values())
      .sort((a, b) => b.lastDate.localeCompare(a.lastDate))
      .slice(0, 4)

    return rows.map<ProjectItem>((r, i) => {
      const isActive = filteredIds.has(r.id)
      const status: ProjectStatus = isActive ? 'in_progress' : 'completed'
      // Naive progress: cap totalHours at 100h → 100%
      const progress = Math.min(100, Math.round((r.hours / 100) * 100))
      const c = r.clientId ? clientMap.get(r.clientId) : null
      return {
        id: r.id,
        name: r.name,
        progress: status === 'completed' ? 100 : progress,
        status,
        color: c?.color || STATUS_PALETTE[i % STATUS_PALETTE.length],
      }
    })
  }, [data.workEntries, data.clients, filtered])

  const totalActive = projects.filter((p) => p.status === 'in_progress').length

  return <ProjectsCard projects={projects} totalActive={totalActive} />
}
