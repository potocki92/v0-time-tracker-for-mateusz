'use client'

import { useMemo } from 'react'
import { UNASSIGNED_PROJECT_ID } from '@/lib/metrics/adapter'
import { formatIsoWeekShort } from '@/lib/format'
import { isoWeekKey } from '@/lib/metrics/period'
import type { MonthMetrics } from '@/lib/metrics/types'
import type { Client, Project, WorkEntry } from '@/lib/types'
import { selectRecentEntries } from '../domain/calendar.selectors'
import type {
  CalendarInsights,
  ProjectAggregate,
  WeeklyHoursBar,
} from '../domain/calendar.types'

interface Args {
  metrics: MonthMetrics
  allEntries: WorkEntry[]
  clients: Client[]
  projects: Project[]
  eurRate: number
}

/**
 * Widgety sekcji "Podsumowanie miesiąca".
 *
 * Nic tu już nie liczy godzin ani kwot — wszystkie liczby przychodzą gotowe
 * z `metrics`, hook dokłada im tylko nazwy, kolory i etykiety. Jedynym
 * wyjątkiem jest lista ostatnich wpisów, która nie jest metryką miesiąca.
 */
export function useCalendarInsights({
  metrics,
  allEntries,
  clients,
  projects,
  eurRate,
}: Args): CalendarInsights {
  const weekly = useMemo<WeeklyHoursBar[]>(() => {
    const currentWeek = isoWeekKey(metrics.today)
    return metrics.byWeek.map((week) => ({
      key: week.isoWeek,
      label: formatIsoWeekShort(week.isoWeek),
      hours: week.hours,
      isCurrent: week.isoWeek === currentWeek,
    }))
  }, [metrics.byWeek, metrics.today])

  const weeklyAggregates = useMemo(() => {
    const active = weekly.filter((w) => w.hours > 0)
    const peak = active.reduce<WeeklyHoursBar | null>(
      (best, week) => (!best || week.hours > best.hours ? week : best),
      null,
    )
    return {
      weeklyAvgHours: active.length
        ? Math.round((metrics.hours.actual / active.length) * 10) / 10
        : 0,
      weeklyPeak: peak,
    }
  }, [weekly, metrics.hours.actual])

  const byProject = useMemo<ProjectAggregate[]>(() => {
    const projectMap = new Map(projects.map((p) => [p.id, p]))
    return metrics.byProject.map((bucket) => {
      const project = projectMap.get(bucket.projectId)
      return {
        projectId: bucket.projectId,
        name:
          project?.name ??
          (bucket.projectId === UNASSIGNED_PROJECT_ID ? 'Bez projektu' : 'Projekt'),
        color: project?.color ?? '',
        hours: bucket.hours,
        amountMinor: bucket.amountMinor,
        share: bucket.shareOfMonth,
      }
    })
  }, [metrics.byProject, projects])

  const recent = useMemo(
    () => selectRecentEntries(allEntries, clients, eurRate),
    [allEntries, clients, eurRate],
  )

  return { weekly, ...weeklyAggregates, byProject, recent }
}
