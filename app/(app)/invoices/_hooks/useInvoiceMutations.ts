'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MUTATION_KEYS, QUERY_KEYS } from '@/lib/query'
import { INVOICES_MANAGER_QUERY_KEY, type SaveInvoiceInput } from '../_domain'
import { deleteInvoiceAction, saveInvoiceAction } from '../_services/invoices.service.server'

function useInvalidateInvoices() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: INVOICES_MANAGER_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices() })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard() })
  }
}

export function useSaveInvoice() {
  const invalidate = useInvalidateInvoices()

  return useMutation({
    mutationKey: MUTATION_KEYS.invoice.create,
    mutationFn: ({ invoiceId, values }: SaveInvoiceInput) => saveInvoiceAction({ invoiceId, values }),
    onSuccess: (_, variables) => {
      toast.success(variables.invoiceId ? 'Faktura została zaktualizowana' : 'Faktura została dodana')
      invalidate()
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać faktury')
    },
  })
}

export function useDeleteInvoice() {
  const invalidate = useInvalidateInvoices()

  return useMutation({
    mutationKey: MUTATION_KEYS.invoice.delete,
    mutationFn: (invoiceId: string) => deleteInvoiceAction(invoiceId),
    onSuccess: () => {
      toast.success('Faktura została usunięta')
      invalidate()
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Nie udało się usunąć faktury')
    },
  })
}
