'use client'

import { useMemo } from 'react'
import type { WorkEntry } from '@/lib/types'
import {
  selectEntriesByDate,
  selectMonthEntries,
} from '../domain/calendar.selectors'

/**
 * Wydziela entries dla aktualnie przeglądanego miesiąca oraz buduje mapę
 * `entriesByDate` do szybkiego lookupu w komórkach grida.
 */
export function useMonthEntries(
  allEntries: WorkEntry[],
  year: number,
  month: number,
) {
  const monthEntries = useMemo(
    () => selectMonthEntries(allEntries, year, month),
    [allEntries, year, month],
  )

  const entriesByDate = useMemo(
    () => selectEntriesByDate(allEntries),
    [allEntries],
  )

  return { monthEntries, entriesByDate }
}
