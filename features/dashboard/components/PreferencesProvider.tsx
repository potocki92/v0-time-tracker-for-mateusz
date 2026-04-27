'use client'

import { useEffect, useRef } from 'react'
import { useDashboardPreferencesQuery } from '../api/useDashboardPreferences'
import { updateDashboardPreferences } from '../services/preferences.service'
import { usePreferencesStore } from '../hooks/usePreferencesStore'
import { type DashboardPreferences } from '../services/preferences.service'

interface PreferencesProviderProps {
  children: React.ReactNode
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const hydrate = usePreferencesStore((s) => s.hydrate)
  const hydrated = useRef(false)
  const { data } = useDashboardPreferencesQuery()

  useEffect(() => {
    if (!data || hydrated.current) return
    hydrated.current = true

    hydrate(data)
  }, [data, hydrate])

  return <>{children}</>
}

export function syncPreferencesToSupabase(): Promise<void> {
  const state = usePreferencesStore.getState()

  const payload: DashboardPreferences = {
    eurToPln: state.eurToPln,
    useLiveRate: state.useLiveRate,
    goal: state.goal,
    displayCurrency: state.displayCurrency,
  }

  return updateDashboardPreferences(payload)
}
