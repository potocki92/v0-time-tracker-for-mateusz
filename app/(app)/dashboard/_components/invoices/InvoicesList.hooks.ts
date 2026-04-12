'use client'

import { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateInvoicePaid } from '@/app/(app)/dashboard/_services/dashboard.fetchers'
import { QUERY_KEYS, MUTATION_KEYS } from '@/lib/query'
import type { DashboardData } from '@/app/(app)/dashboard/_domain/dashboard.types'
import type { MarkPaidVariables, MarkPaidContext } from './InvoicesList.types'

// ── useMarkInvoicePaid ────────────────────────────────────────────────────────

interface UseMarkInvoicePaidOptions {
  onSuccess?: (invoiceId: string) => void
}

interface UseMarkInvoicePaidReturn {
  markPaid:        (invoiceId: string) => void
  isPending:       boolean
  pendingInvoiceId: string | null
  /** Lokalne IDs ukrytych faktur — znikają natychmiast po kliknięciu */
  localHidden:     ReadonlySet<string>
}

/**
 * Mutacja oznaczania faktury jako opłaconej.
 *
 * Dwie warstwy optimistic updates:
 * 1. `localHidden` — natychmiastowe ukrycie w UI (przed response)
 * 2. TanStack `onMutate` — aktualizacja globalnego cache dashboardu
 *
 * Rollback obu warstw przy błędzie.
 */
export function useMarkInvoicePaid(
  { onSuccess }: UseMarkInvoicePaidOptions = {}
): UseMarkInvoicePaidReturn {
  const queryClient = useQueryClient()

  // Warstwa 1 — lokalny optimistic state
  const [localHidden, setLocalHidden] = useState<ReadonlySet<string>>(new Set())

  const { mutate, isPending, variables } = useMutation<
    void,
    Error,
    MarkPaidVariables,
    MarkPaidContext
  >({
    mutationKey: MUTATION_KEYS.invoice.markPaid,
    mutationFn:  ({ invoiceId }) => updateInvoicePaid(invoiceId),

    // Warstwa 2 — TanStack optimistic update
    onMutate: async ({ invoiceId }) => {
      // Anuluj in-flight queries — zapobiegamy nadpisaniu optimistic state
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.dashboard() })

      // Snapshot do rollbacku
      const previousData = queryClient.getQueryData<DashboardData>(
        QUERY_KEYS.dashboard()
      )

      // Natychmiastowa aktualizacja cache dashboardu
      queryClient.setQueryData<DashboardData>(
        QUERY_KEYS.dashboard(),
        (old) => {
          if (!old) return old
          return {
            ...old,
            invoices: old.invoices.map((inv) =>
              inv.id === invoiceId ? { ...inv, is_paid: true } : inv
            ),
          }
        }
      )

      return { previousData }
    },

    onSuccess: (_, { invoiceId }) => {
      // Granularny invalidate — tylko faktury, nie cały dashboard
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices() })
      toast.success('Faktura oznaczona jako opłacona')
      onSuccess?.(invoiceId)
    },

    onError: (error, { invoiceId }, context) => {
      // Rollback TanStack cache
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEYS.dashboard(), context.previousData)
      }
      // Rollback lokalnego ukrycia
      setLocalHidden((prev) => {
        const next = new Set(prev)
        next.delete(invoiceId)
        return next
      })
      toast.error(`Nie udało się zaktualizować: ${error.message}`)
    },
  })

  const markPaid = useCallback(
    (invoiceId: string) => {
      // Warstwa 1 — ukryj natychmiast
      setLocalHidden((prev) => new Set([...prev, invoiceId]))
      // Warstwa 2 — mutacja z TanStack
      mutate({ invoiceId })
    },
    [mutate]
  )

  return {
    markPaid,
    isPending,
    pendingInvoiceId: isPending ? (variables?.invoiceId ?? null) : null,
    localHidden,
  }
}