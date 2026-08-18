'use client'

import { useCallback, useState } from 'react'
import { getDateString } from '@/lib/helpers'

interface UseDayDialogArgs {
  currentYear: number
  currentMonth: number
  onOpen: (dateStr: string) => void
}

/**
 * Zarządza stanem modala (open/close + selectedDay).
 * Decouple od formularza i mutacji — side-effecty robi rodzic przez callbacki.
 */
export function useDayDialog({
  currentYear,
  currentMonth,
  onOpen,
}: UseDayDialogArgs) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const openDay = useCallback(
    (day: number) => {
      const dateStr = getDateString(currentYear, currentMonth, day)
      setSelectedDay(day)
      onOpen(dateStr)
      setIsOpen(true)
    },
    [currentYear, currentMonth, onOpen],
  )

  const close = useCallback(() => setIsOpen(false), [])

  const selectedDateStr =
    selectedDay !== null
      ? getDateString(currentYear, currentMonth, selectedDay)
      : null

  return {
    selectedDay,
    selectedDateStr,
    isOpen,
    setIsOpen,
    openDay,
    close,
  }
}
