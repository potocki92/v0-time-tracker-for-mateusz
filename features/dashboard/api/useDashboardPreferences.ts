'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import {
  fetchDashboardPreferences,
  updateDashboardPreferences,
  type DashboardPreferences,
} from '../services/preferences.service'

const preferencesKey = ['dashboard', 'preferences'] as const

export function useDashboardPreferencesQuery() {
  return useQuery({
    queryKey: preferencesKey,
    queryFn: fetchDashboardPreferences,
    staleTime: 60_000,
  })
}

export function useDashboardPreferencesMutation() {
  return useMutation({
    mutationFn: (input: DashboardPreferences) => updateDashboardPreferences(input),
  })
}
