'use client'

import { useMemo } from 'react'
import type { Client, WorkEntry } from '@/lib/types'
import { selectCalendarStats } from '../_domain/calendar.selectors'
import type { CalendarStats } from '../_domain/calendar.types'

export function useCalendarStats(
  monthEntries: WorkEntry[],
  clients: Client[],
  eurRate: number,
): CalendarStats {
  return useMemo(
    () => selectCalendarStats(monthEntries, clients, eurRate),
    [monthEntries, clients, eurRate],
  )
}
