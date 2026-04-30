'use client'

/**
 * InvoicesList.hooks.ts — zaktualizowana wersja z undo toast (#16)
 *
 * Zmiany względem oryginału z #14:
 * - useMutation zastąpiony przez useUndoableAction
 * - Mutacja jest wysyłana do serwera dopiero po 5s (jeśli user nie cofnął)
 * - Zachowane: optimistic update w TanStack cache, haptic feedback, localHidden
 *
 * WAŻNE: useUndoableAction zarządza teraz opóźnionym wywołaniem serwera.
 * isPending = true przez całe 5s okno undo (toast widoczny).
 */

import { useCallback, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { updateInvoicePaidStatusAction } from '@/features/invoices/services/invoices.service.server'
import { QUERY_KEYS } from '@/lib/query'
import { useHaptic } from '@/hooks/useHaptic'
import { useUndoableAction } from '@/hooks/useUndoableAction'
import type { DashboardData } from '@/app/(app)/dashboard/_domain/dashboard.types'

interface UseMarkInvoicePaidOptions {
  onSuccess?: (invoiceId: string) => void
}

interface UseMarkInvoicePaidReturn {
  markPaid:         (invoiceId: string) => void
  isPending:        boolean
  pendingInvoiceId: string | null
  localHidden:      ReadonlySet<string>
}

export function useMarkInvoicePaid(
  { onSuccess }: UseMarkInvoicePaidOptions = {}
): UseMarkInvoicePaidReturn {
  const queryClient = useQueryClient()
  const haptic      = useHaptic()

  const [localHidden,  setLocalHidden]  = useState<ReadonlySet<string>>(new Set())
  const [pendingId,    setPendingId]    = useState<string | null>(null)
  const pendingSetRef = useRef(new Set<string>())

  // Optimistic update cache dashboardu
  const applyOptimistic = useCallback((invoiceId: string) => {
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
    setLocalHidden((prev) => new Set([...prev, invoiceId]))
    pendingSetRef.current.add(invoiceId)
    setPendingId(invoiceId)
  }, [queryClient])

  // Rollback przy cofnięciu
  const rollback = useCallback((invoiceId: string) => {
    queryClient.setQueryData<DashboardData>(
      QUERY_KEYS.dashboard(),
      (old) => {
        if (!old) return old
        return {
          ...old,
          invoices: old.invoices.map((inv) =>
            inv.id === invoiceId ? { ...inv, is_paid: false } : inv
          ),
        }
      }
    )
    setLocalHidden((prev) => {
      const next = new Set(prev)
      next.delete(invoiceId)
      return next
    })
    pendingSetRef.current.delete(invoiceId)
    setPendingId(null)
    haptic.error()
  }, [queryClient, haptic])

  const { execute } = useUndoableAction<string>({
    action: async (invoiceId) => {
      await updateInvoicePaidStatusAction(invoiceId, true)
      // Granularny invalidate po potwierdzeniu z serwera
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices() })
      pendingSetRef.current.delete(invoiceId)
      setPendingId(null)
      haptic.success()
      onSuccess?.(invoiceId)
    },
    onOptimistic: applyOptimistic,
    onUndo:       rollback,
    undoDelay:    5000,
    successMessage: 'Faktura oznaczona jako opłacona',
    errorMessage:   'Nie udało się zaktualizować faktury',
  })

  const markPaid = useCallback(
    (invoiceId: string) => {
      haptic.light()
      execute(invoiceId, invoiceId) // actionId = invoiceId → unikalny per faktura
    },
    [execute, haptic]
  )

  return {
    markPaid,
    isPending:        pendingSetRef.current.size > 0,
    pendingInvoiceId: pendingId,
    localHidden,
  }
}
