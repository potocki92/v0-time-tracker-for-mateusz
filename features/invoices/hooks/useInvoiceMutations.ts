'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MUTATION_KEYS, QUERY_KEYS } from '@/lib/query'
import type { InvoiceLifecycleStatus } from '@/lib/types'
import { INVOICE_STATUS_LABELS_PL } from '@/lib/finance/invoice-status'
import { INVOICES_MANAGER_QUERY_KEY, type SaveInvoiceInput } from '../domain'
import {
  deleteInvoiceAction,
  runAutoIssueInvoicesAction,
  saveInvoiceAction,
  updateInvoicePaidStatusAction,
  updateInvoiceStatusAction,
} from '../services/invoices.service.server'

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

export function useRunAutoIssueInvoices() {
  const invalidate = useInvalidateInvoices()

  return useMutation({
    mutationKey: MUTATION_KEYS.invoice.autoIssue,
    mutationFn: () => runAutoIssueInvoicesAction(),
    onSuccess: (result) => {
      if (result.created > 0) {
        toast.success(`Auto-fakturowanie utworzyło ${result.created} faktur.`)
      } else {
        toast.message(`Brak nowych faktur dla okresu ${result.periodStart} - ${result.periodEnd}.`)
      }
      invalidate()
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Auto-fakturowanie nie powiodło się')
    },
  })
}

export function useUpdateInvoiceStatus() {
  const invalidate = useInvalidateInvoices()

  return useMutation({
    mutationKey: MUTATION_KEYS.invoice.updateStatus,
    mutationFn: ({ invoiceId, status }: { invoiceId: string; status: InvoiceLifecycleStatus }) =>
      updateInvoiceStatusAction(invoiceId, status),
    onSuccess: (_, variables) => {
      toast.success(`Status zmieniono na: ${INVOICE_STATUS_LABELS_PL[variables.status]}`)
      invalidate()
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Nie udało się zmienić statusu faktury')
    },
  })
}

export function useSetInvoicePaidStatus() {
  const invalidate = useInvalidateInvoices()

  return useMutation({
    mutationKey: MUTATION_KEYS.invoice.markPaid,
    mutationFn: ({ invoiceId, isPaid }: { invoiceId: string; isPaid: boolean }) =>
      updateInvoicePaidStatusAction(invoiceId, isPaid),
    onSuccess: (_, variables) => {
      toast.success(variables.isPaid ? 'Faktura oznaczona jako opłacona' : 'Faktura oznaczona jako nieopłacona')
      invalidate()
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Nie udało się zaktualizować statusu faktury')
    },
  })
}
