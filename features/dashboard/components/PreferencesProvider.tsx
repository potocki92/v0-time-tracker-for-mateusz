'use client'

import { updateDashboardPreferences } from '../services/preferences.service'
import { usePreferencesStore } from '../hooks/usePreferencesStore'
import { type DashboardPreferences } from '../services/preferences.service'

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
