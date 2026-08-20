'use client'

import { updateDashboardPreferencesAction, type DashboardPreferences } from '../actions'
import { usePreferencesStore } from '../hooks/usePreferencesStore'

export function syncPreferencesToSupabase(): Promise<void> {
  const state = usePreferencesStore.getState()

  const payload: DashboardPreferences = {
    eurToPln: state.eurToPln,
    useLiveRate: state.useLiveRate,
    goal: state.goal,
    displayCurrency: state.displayCurrency,
  }

  return updateDashboardPreferencesAction(payload)
}
