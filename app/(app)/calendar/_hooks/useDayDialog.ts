'use client'

import { useCallback, useState } from 'react'
import { getDateString, isFutureDate } from '@/lib/helpers'
import type { WorkEntry } from '@/lib/types'

interface UseDayDialogArgs {
  currentYear: number
  currentMonth: number
  entriesByDate: Map<string, WorkEntry>
  onOpen: (existing: WorkEntry | undefined) => void
}

/**
 * Zarządza stanem modala (open/close + selectedDay).
 * Decouple od formularza i mutacji — side-effecty robi rodzic przez callbacki.
 */
export function useDayDialog({
  currentYear,
  currentMonth,
  entriesByDate,
  onOpen,
}: UseDayDialogArgs) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const openDay = useCallback(
    (day: number) => {
      const dateStr = getDateString(currentYear, currentMonth, day)
      if (isFutureDate(dateStr)) return
      const existing = entriesByDate.get(dateStr)
      setSelectedDay(day)
      onOpen(existing)
      setIsOpen(true)
    },
    [currentYear, currentMonth, entriesByDate, onOpen],
  )

  const close = useCallback(() => setIsOpen(false), [])

  const selectedDateStr =
    selectedDay !== null
      ? getDateString(currentYear, currentMonth, selectedDay)
      : null

  const existingEntry = selectedDateStr
    ? entriesByDate.get(selectedDateStr)
    : undefined

  return {
    selectedDay,
    selectedDateStr,
    existingEntry,
    isOpen,
    setIsOpen,
    openDay,
    close,
  }
}
