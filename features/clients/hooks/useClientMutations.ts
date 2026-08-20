'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  addClientRateAction,
  createClientAction,
  deleteClientAction,
  deleteClientRateAction,
  updateClientAction,
} from '../actions'
import { MUTATION_KEYS, QUERY_KEYS } from '@/lib/query'
import type { ClientFormData, ClientRateFormData } from '@/lib/types'

/**
 * Mutacje CRUD klientów + historii stawek. Po sukcesie inwalidują całą
 * podprzestrzeń `dashboard-module` → dashboard i clients zobaczą świeże dane.
 *
 * Zapis robią Server Actions — `user_id` bierze się z sesji po stronie serwera,
 * nie z parametru hooka.
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

export function useCreateClient() {
  const invalidate = useInvalidateClients()
  return useMutation({
    mutationKey: MUTATION_KEYS.client.create,
    mutationFn:  (form: ClientFormData) => createClientAction(form),
    onSuccess: () => {
      toast.success('Dodano klienta')
      invalidate()
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : 'Błąd podczas dodawania')
    },
  })
}

export function useUpdateClient() {
  const invalidate = useInvalidateClients()
  return useMutation({
    mutationKey: MUTATION_KEYS.client.update,
    mutationFn:  (args: { id: string; form: ClientFormData }) =>
      updateClientAction(args.id, args.form),
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
    mutationFn:  (id: string) => deleteClientAction(id),
    onSuccess: () => {
      toast.success('Usunięto klienta')
      invalidate()
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : 'Błąd podczas usuwania')
    },
  })
}

export function useAddClientRate() {
  const invalidate = useInvalidateClients()
  return useMutation({
    mutationKey: MUTATION_KEYS.client.addRate,
    mutationFn:  (args: {
      clientId:    string
      form:        ClientRateFormData
      makeCurrent: boolean
    }) => addClientRateAction(args.clientId, args.form, args.makeCurrent),
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
    mutationFn:  (id: string) => deleteClientRateAction(id),
    onSuccess: () => {
      toast.success('Usunięto wpis historii stawki')
      invalidate()
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : 'Błąd podczas usuwania')
    },
  })
}
