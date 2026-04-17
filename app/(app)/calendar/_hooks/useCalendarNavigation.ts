'use client'

import { useCallback, useState } from 'react'
import { getDaysInMonth, getFirstDayOfMonth } from '@/lib/helpers'

/**
 * Zarządza stanem nawigacji miesiąc/rok + shortcut-em "Dziś".
 * Wydzielone z useCalendarData żeby móc używać niezależnie (np. w mini-kalendarzu).
 */
export function useCalendarNavigation() {
  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [currentYear, setCurrentYear] = useState(now.getFullYear())

  const prevMonth = useCallback(() => {
    setCurrentMonth((m) => {
      if (m === 0) {
        setCurrentYear((y) => y - 1)
        return 11
      }
      return m - 1
    })
  }, [])

  const nextMonth = useCallback(() => {
    setCurrentMonth((m) => {
      if (m === 11) {
        setCurrentYear((y) => y + 1)
        return 0
      }
      return m + 1
    })
  }, [])

  const goToToday = useCallback(() => {
    const today = new Date()
    setCurrentMonth(today.getMonth())
    setCurrentYear(today.getFullYear())
  }, [])

  const isCurrentMonth =
    currentMonth === now.getMonth() && currentYear === now.getFullYear()

  return {
    currentMonth,
    currentYear,
    daysInMonth: getDaysInMonth(currentYear, currentMonth),
    firstDayOfMonth: getFirstDayOfMonth(currentYear, currentMonth),
    isCurrentMonth,
    prevMonth,
    nextMonth,
    goToToday,
  }
}
