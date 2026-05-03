'use client'

import { useCallback, useEffect, useState } from 'react'
import { offsetDateKey, type DateKey } from '../lib/date-keys'
import { todayKey } from '../lib/analytics'
import type { PeriodPreset, ReportsFilters } from '../lib/types'

const DEFAULT_PRESET: PeriodPreset = '30d'

const EMPTY_FILTERS: ReportsFilters = {
  preset:    DEFAULT_PRESET,
  from:      '',
  to:        '',
  clientId:  'all',
  projectId: 'all',
  tag:       'all',
  compare:   false,
}

export type UseReportsFiltersReturn = {
  filters:        ReportsFilters
  today:          DateKey | null
  setPreset:      (p: PeriodPreset) => void
  setFrom:        (d: DateKey) => void
  setTo:          (d: DateKey) => void
  setClientId:    (id: string) => void
  setProjectId:   (id: string) => void
  setTag:         (tag: string) => void
  toggleCompare:  () => void
  resetFilters:   () => void
}

/**
 * Stan filtrów raportu. SSR-safe — `today` jest `null` aż do efektu w kliencie,
 * dzięki czemu render serwera i pierwszy render klienta są identyczne.
 */
export function useReportsFilters(): UseReportsFiltersReturn {
  const [today,    setToday]    = useState<DateKey | null>(null)
  const [filters,  setFilters]  = useState<ReportsFilters>(EMPTY_FILTERS)

  useEffect(() => {
    const t = todayKey()
    setToday(t)
    setFilters((prev) => ({
      ...prev,
      from: offsetDateKey(t, -29),
      to:   t,
    }))
  }, [])

  const setPreset = useCallback((preset: PeriodPreset) => {
    setFilters((prev) => ({ ...prev, preset }))
  }, [])

  const setFrom = useCallback((from: DateKey) => {
    setFilters((prev) => ({ ...prev, from, preset: 'custom' }))
  }, [])

  const setTo = useCallback((to: DateKey) => {
    setFilters((prev) => ({ ...prev, to, preset: 'custom' }))
  }, [])

  const setClientId  = useCallback((clientId:  string) => setFilters((p) => ({ ...p, clientId  })), [])
  const setProjectId = useCallback((projectId: string) => setFilters((p) => ({ ...p, projectId })), [])
  const setTag       = useCallback((tag:       string) => setFilters((p) => ({ ...p, tag       })), [])

  const toggleCompare = useCallback(() => {
    setFilters((p) => ({ ...p, compare: !p.compare }))
  }, [])

  const resetFilters = useCallback(() => {
    if (!today) return
    setFilters({
      ...EMPTY_FILTERS,
      from: offsetDateKey(today, -29),
      to:   today,
    })
  }, [today])

  return {
    filters,
    today,
    setPreset,
    setFrom,
    setTo,
    setClientId,
    setProjectId,
    setTag,
    toggleCompare,
    resetFilters,
  }
}
