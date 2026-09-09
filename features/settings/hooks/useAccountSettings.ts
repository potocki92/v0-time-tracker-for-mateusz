'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { errorCodeOf, unwrap } from '@/lib/errors/action-result'
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

/**
 * Wszystkie mutacje ustawien tlumacza KODY zwrocone przez Server Action —
 * `messages/<locale>/errors.json` dla bledow, `settings.toast` dla sukcesow.
 * W tej warstwie nie ma ani jednego zdania po polsku.
 */
function useActionToast() {
  const te = useTranslations('errors')
  const ts = useTranslations('settings.toast')

  return {
    success: (key: string, values?: Record<string, string | number>) =>
      toast.success(ts(key, values)),
    failure: (error: unknown) => {
      const { code, values } = errorCodeOf(error)
      toast.error(te(code, values))
    },
  }
}

export function useProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.accountProfile(),
    queryFn: async () => unwrap(await fetchAccountProfileAction()),
    retry: 1,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  const notify = useActionToast()
  const tSettings = useTranslations('settings')

  return useMutation({
    mutationKey: MUTATION_KEYS.account.updateProfile,
    mutationFn: async (values: AccountSettingsFormValues) =>
      unwrap(await updateAccountProfileAction(values)),
    onSuccess: async () => {
      toast.success(tSettings('profile.saved'))
      await qc.invalidateQueries({ queryKey: QUERY_KEYS.accountProfile() })
      // Dashboard wita uzytkownika po imieniu (`resolveUserName` czyta
      // `user_metadata`), wiec zmiana profilu musi uniewaznic takze jego dane.
      await qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard() })
    },
    onError: notify.failure,
  })
}

export function useUpdateAvatar() {
  const qc = useQueryClient()
  const notify = useActionToast()

  return useMutation({
    mutationKey: MUTATION_KEYS.account.uploadAvatar,
    mutationFn: async (file: File) => unwrap(await uploadAvatarAction(file)),
    onSuccess: async () => {
      notify.success('AVATAR_UPDATED')
      await qc.invalidateQueries({ queryKey: QUERY_KEYS.accountProfile() })
    },
    onError: notify.failure,
  })
}

export function useUpdateInvoiceAutomationSettings() {
  const qc = useQueryClient()
  const notify = useActionToast()

  return useMutation({
    mutationKey: MUTATION_KEYS.account.updateInvoiceSettings,
    mutationFn: async (values: InvoiceSettings) =>
      unwrap(await updateInvoiceAutomationSettingsAction(values)),
    onSuccess: async () => {
      notify.success('INVOICE_SETTINGS_SAVED')
      await qc.invalidateQueries({ queryKey: QUERY_KEYS.accountProfile() })
      await qc.invalidateQueries({ queryKey: QUERY_KEYS.invoices() })
    },
    onError: notify.failure,
  })
}

export function useWeeklySummaryEmail() {
  return useQuery({
    queryKey: QUERY_KEYS.weeklySummaryEmail(),
    queryFn: async () => unwrap(await fetchWeeklySummaryEmailAction()),
    retry: 1,
  })
}

export function useUpdateWeeklySummaryEmail() {
  const qc = useQueryClient()
  const notify = useActionToast()

  return useMutation({
    mutationKey: MUTATION_KEYS.account.updateWeeklySummaryEmail,
    mutationFn: async (values: WeeklySummaryEmailSettings) =>
      unwrap(await updateWeeklySummaryEmailAction(values)),
    onSuccess: async () => {
      notify.success('WEEKLY_SUMMARY_SAVED')
      await qc.invalidateQueries({ queryKey: QUERY_KEYS.weeklySummaryEmail() })
    },
    onError: notify.failure,
  })
}

export function useSendWeeklySummaryEmail() {
  const notify = useActionToast()

  return useMutation({
    mutationKey: MUTATION_KEYS.account.sendWeeklySummaryEmail,
    mutationFn: async () => unwrap(await sendWeeklySummaryEmailNowAction()),
    onSuccess: ({ recipient }) => {
      notify.success('WEEKLY_SUMMARY_SENT', { recipient })
    },
    onError: notify.failure,
  })
}
