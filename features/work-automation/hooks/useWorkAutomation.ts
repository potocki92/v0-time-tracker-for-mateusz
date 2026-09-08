'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { MUTATION_KEYS, QUERY_KEYS } from '@/lib/query'

import type { WorkAutomationSettingsInput } from '../domain'
import {
  fetchWorkAutomationOverviewAction,
  resumeWorkAction,
  updateWorkAutomationSettingsAction,
} from '../actions'

export function useWorkAutomationOverview() {
  return useQuery({
    queryKey: QUERY_KEYS.workAutomation(),
    queryFn: fetchWorkAutomationOverviewAction,
    retry: 1,
  })
}

/**
 * Po zapisie konfiguracji uniewazniamy takze kalendarz i pulpit: kolejny
 * przebieg zadania moze dopisac dzien, ktory te widoki juz maja w cache.
 */
function useAutomationInvalidation() {
  const queryClient = useQueryClient()

  return async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workAutomation() })
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.calendar() })
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard() })
  }
}

export function useUpdateWorkAutomation() {
  const invalidate = useAutomationInvalidation()

  return useMutation({
    mutationKey: MUTATION_KEYS.account.updateWorkAutomation,
    mutationFn: (values: WorkAutomationSettingsInput) =>
      updateWorkAutomationSettingsAction(values),
    onSuccess: async () => {
      toast.success('Zapisano ustawienia automatu')
      await invalidate()
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać ustawień automatu')
    },
  })
}

export function useResumeWork() {
  const invalidate = useAutomationInvalidation()

  return useMutation({
    mutationKey: MUTATION_KEYS.account.resumeWorkAutomation,
    mutationFn: (resumeDate: string) => resumeWorkAction(resumeDate),
    onSuccess: async () => {
      toast.success('Zapisano wznowienie pracy')
      await invalidate()
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać wznowienia')
    },
  })
}
