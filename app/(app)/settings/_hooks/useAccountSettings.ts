'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MUTATION_KEYS, QUERY_KEYS } from '@/lib/query'
import type { AccountSettingsFormValues } from '../_domain'
import {
  fetchAccountProfile,
  updateAccountProfile,
  uploadAvatar,
} from '../_services'

export function useProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.accountProfile(),
    queryFn: fetchAccountProfile,
    retry: 1,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()

  return useMutation({
    mutationKey: MUTATION_KEYS.account.updateProfile,
    mutationFn: (values: AccountSettingsFormValues) => updateAccountProfile(values),
    onSuccess: async () => {
      toast.success('Zapisano ustawienia konta')
      await qc.invalidateQueries({ queryKey: QUERY_KEYS.accountProfile() })
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
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: async () => {
      toast.success('Avatar został zaktualizowany')
      await qc.invalidateQueries({ queryKey: QUERY_KEYS.accountProfile() })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Nie udało się wgrać avatara')
    },
  })
}
