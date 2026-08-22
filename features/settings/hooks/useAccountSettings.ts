'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MUTATION_KEYS, QUERY_KEYS } from '@/lib/query'
import type {
  AccountSettingsFormValues,
  InvoiceSettings,
  WeeklySummaryEmailSettings,
} from '../domain'
import {
  fetchAccountProfileAction,
  fetchWeeklySummaryEmailAction,
  sendWeeklySummaryEmailNowAction,
  updateAccountProfileAction,
  updateInvoiceAutomationSettingsAction,
  updateWeeklySummaryEmailAction,
  uploadAvatarAction,
} from '../actions'

export function useProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.accountProfile(),
    queryFn: fetchAccountProfileAction,
    retry: 1,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()

  return useMutation({
    mutationKey: MUTATION_KEYS.account.updateProfile,
    mutationFn: (values: AccountSettingsFormValues) => updateAccountProfileAction(values),
    onSuccess: async () => {
      toast.success('Zapisano ustawienia konta')
      await qc.invalidateQueries({ queryKey: QUERY_KEYS.accountProfile() })
      // Dashboard wita uzytkownika po imieniu (`resolveUserName` czyta
      // `user_metadata`), wiec zmiana profilu musi uniewaznic takze jego dane.
      await qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard() })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać profilu')
    },
  })
}

export function useUpdateAvatar() {
  const qc = useQueryClient()

  return useMutation({
    mutationKey: MUTATION_KEYS.account.uploadAvatar,
    mutationFn: (file: File) => uploadAvatarAction(file),
    onSuccess: async () => {
      toast.success('Avatar został zaktualizowany')
      await qc.invalidateQueries({ queryKey: QUERY_KEYS.accountProfile() })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Nie udało się wgrać avatara')
    },
  })
}

export function useUpdateInvoiceAutomationSettings() {
  const qc = useQueryClient()

  return useMutation({
    mutationKey: MUTATION_KEYS.account.updateInvoiceSettings,
    mutationFn: (values: InvoiceSettings) => updateInvoiceAutomationSettingsAction(values),
    onSuccess: async () => {
      toast.success('Zapisano ustawienia automatyzacji faktur')
      await qc.invalidateQueries({ queryKey: QUERY_KEYS.accountProfile() })
      await qc.invalidateQueries({ queryKey: QUERY_KEYS.invoices() })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać ustawień faktur')
    },
  })
}

export function useWeeklySummaryEmail() {
  return useQuery({
    queryKey: QUERY_KEYS.weeklySummaryEmail(),
    queryFn: fetchWeeklySummaryEmailAction,
    retry: 1,
  })
}

export function useUpdateWeeklySummaryEmail() {
  const qc = useQueryClient()

  return useMutation({
    mutationKey: MUTATION_KEYS.account.updateWeeklySummaryEmail,
    mutationFn: (values: WeeklySummaryEmailSettings) => updateWeeklySummaryEmailAction(values),
    onSuccess: async () => {
      toast.success('Zapisano ustawienia skrótu tygodnia')
      await qc.invalidateQueries({ queryKey: QUERY_KEYS.weeklySummaryEmail() })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać ustawień')
    },
  })
}

export function useSendWeeklySummaryEmail() {
  return useMutation({
    mutationKey: MUTATION_KEYS.account.sendWeeklySummaryEmail,
    mutationFn: sendWeeklySummaryEmailNowAction,
    onSuccess: ({ recipient }) => {
      toast.success(`Wysłano skrót na ${recipient}`)
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Nie udało się wysłać skrótu')
    },
  })
}
