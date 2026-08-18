'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  addClientRate,
  createClient,
  deleteClient,
  deleteClientRate,
  fetchCurrentUserId,
  updateClient,
  type ClientMutationInput,
} from '../services/clients.fetchers'
import { MUTATION_KEYS, QUERY_KEYS } from '@/lib/query'
import type { ClientFormData, ClientRateFormData } from '@/lib/types'

/**
 * Mutacje CRUD klientów + historii stawek. Po sukcesie inwalidują całą
 * podprzestrzeń `dashboard-module` → dashboard i clients zobaczą świeże dane.
 */

function useInvalidateClients() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: QUERY_KEYS.clientsData() })
    qc.invalidateQueries({ queryKey: QUERY_KEYS.clients() })
    qc.invalidateQueries({ queryKey: QUERY_KEYS.clientRates() })
    qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard() })
  }
}

async function resolveUserId(userId?: string): Promise<string> {
  return userId ?? (await fetchCurrentUserId())
}

export function useCreateClient(userId?: string) {
  const invalidate = useInvalidateClients()
  return useMutation({
    mutationKey: MUTATION_KEYS.client.create,
    mutationFn:  async (form: ClientFormData) => {
      const uid = await resolveUserId(userId)
      return createClient({ ...form, user_id: uid } as ClientMutationInput)
    },
    onSuccess: () => {
      toast.success('Dodano klienta')
      invalidate()
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : 'Błąd podczas dodawania')
    },
  })
}

export function useUpdateClient(userId?: string) {
  const invalidate = useInvalidateClients()
  return useMutation({
    mutationKey: MUTATION_KEYS.client.update,
    mutationFn:  async (args: { id: string; form: ClientFormData }) => {
      const uid = await resolveUserId(userId)
      return updateClient(args.id, { ...args.form, user_id: uid } as ClientMutationInput)
    },
    onSuccess: () => {
      toast.success('Zaktualizowano klienta')
      invalidate()
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : 'Błąd podczas aktualizacji')
    },
  })
}

export function useDeleteClient() {
  const invalidate = useInvalidateClients()
  return useMutation({
    mutationKey: MUTATION_KEYS.client.delete,
    mutationFn:  (id: string) => deleteClient(id),
    onSuccess: () => {
      toast.success('Usunięto klienta')
      invalidate()
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : 'Błąd podczas usuwania')
    },
  })
}

export function useAddClientRate(userId?: string) {
  const invalidate = useInvalidateClients()
  return useMutation({
    mutationKey: MUTATION_KEYS.client.addRate,
    mutationFn:  async (args: {
      clientId:    string
      form:        ClientRateFormData
      makeCurrent: boolean
    }) => {
      const uid = await resolveUserId(userId)
      return addClientRate(uid, args.clientId, args.form, args.makeCurrent)
    },
    onSuccess: () => {
      toast.success('Dodano nową stawkę')
      invalidate()
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : 'Błąd podczas dodawania stawki')
    },
  })
}

export function useDeleteClientRate() {
  const invalidate = useInvalidateClients()
  return useMutation({
    mutationKey: MUTATION_KEYS.client.deleteRate,
    mutationFn:  (id: string) => deleteClientRate(id),
    onSuccess: () => {
      toast.success('Usunięto wpis historii stawki')
      invalidate()
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : 'Błąd podczas usuwania')
    },
  })
}
