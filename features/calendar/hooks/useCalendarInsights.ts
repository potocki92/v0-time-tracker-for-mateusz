'use client'

import { useMemo } from 'react'
import type { Client, WorkEntry } from '@/lib/types'
import {
  selectActiveStreak,
  selectDayComposition,
  selectHoursPerWeek,
  selectRecentEntries,
  selectTimeByProject,
} from '../domain/calendar.selectors'
import type {
  ActiveStreak,
  CalendarInsights,
} from '../domain/calendar.types'

interface Args {
  allEntries: WorkEntry[]
  monthEntries: WorkEntry[]
  clients: Client[]
  eurRate: number
  year: number
  month: number
  daysInMonth: number
}

/**
 * Wszystkie agregaty potrzebne sekcji "Month Insights" + active streak.
 * Każdy fragment liczony jest niezależnie i memoizowany — żeby dodanie nowego
 * widgetu nie ponownie liczyło reszty.
 */
export function useCalendarInsights({
  allEntries,
  monthEntries,
  clients,
  eurRate,
  year,
  month,
  daysInMonth,
}: Args): CalendarInsights & { activeStreak: ActiveStreak } {
  const weekly = useMemo(
    () => selectHoursPerWeek(monthEntries, year, month, daysInMonth),
    [monthEntries, year, month, daysInMonth],
  )

  const weeklyAggregates = useMemo(() => {
    const total = weekly.reduce((sum, w) => sum + w.hours, 0)
    const nonEmpty = weekly.filter((w) => w.hours > 0).length || 1
    let peak: { hours: number; date: string } | null = null
    for (const entry of monthEntries) {
      if (entry.status !== 'worked') continue
      const hours = entry.hours ?? 0
      if (!peak || hours > peak.hours) {
        peak = { hours, date: entry.date }
      }
    }
    return {
      weeklyTotalHours: Math.round(total * 10) / 10,
      weeklyAvgHours: Math.round((total / nonEmpty) * 10) / 10,
      weeklyPeak: peak,
    }
  }, [weekly, monthEntries])

  const byProject = useMemo(
    () => selectTimeByProject(monthEntries, clients, eurRate),
    [monthEntries, clients, eurRate],
  )

  const composition = useMemo(
    () => selectDayComposition(monthEntries, year, month, daysInMonth),
    [monthEntries, year, month, daysInMonth],
  )

  const recent = useMemo(
    () => selectRecentEntries(allEntries, clients, eurRate),
    [allEntries, clients, eurRate],
  )

  const activeStreak = useMemo(
    () => selectActiveStreak(allEntries),
    [allEntries],
  )

  return {
    weekly,
    ...weeklyAggregates,
    byProject,
    composition,
    recent,
    activeStreak,
  }
}
