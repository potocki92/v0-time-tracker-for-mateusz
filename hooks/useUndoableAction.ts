'use client'

/**
 * #16 — Toast z opcją "Cofnij" (undo pattern)
 *
 * Plik: src/hooks/useUndoableAction.ts
 *
 * Wzorzec:
 * 1. User klika "Oznacz jako zapłacone"
 * 2. UI reaguje natychmiast (optimistic update)
 * 3. Toast z przyciskiem "Cofnij" pojawia się na 5s
 * 4a. User klika "Cofnij" → rollback + anulowanie mutacji
 * 4b. User ignoruje → po 5s mutacja jest wysyłana do serwera
 *
 * Dzięki temu serwer jest wołany TYLKO jeśli user nie cofnął.
 * Mniej zapytań niż klasyczne optimistic update + rollback.
 */

import { useCallback, useRef } from 'react'
import { toast } from 'sonner'

interface UseUndoableActionOptions<T> {
  /** Właściwa akcja (np. updateInvoicePaid) — wywoływana po upływie delay */
  action:        (payload: T) => Promise<void>
  /** Callback wywoływany natychmiast — aktualizuje UI optimistycznie */
  onOptimistic?: (payload: T) => void
  /** Callback do przywrócenia UI po cofnięciu */
  onUndo?:       (payload: T) => void
  /** Czas w ms na cofnięcie (default: 5000) */
  undoDelay?:    number
  /** Tekst sukcesu w toaście */
  successMessage?: string
  /** Tekst błędu */
  errorMessage?:   string
}

export function useUndoableAction<T>({
  action,
  onOptimistic,
  onUndo,
  undoDelay      = 5000,
  successMessage = 'Gotowe',
  errorMessage   = 'Wystąpił błąd',
}: UseUndoableActionOptions<T>) {
  // Mapa timeoutów — klucz to identyfikator akcji (może być wiele jednocześnie)
  const pendingTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  // Mapa "czy cofnięto" — sprawdzamy przed wysłaniem do serwera
  const undoneActions = useRef(new Set<string>())

  const execute = useCallback(
    (payload: T, actionId: string = String(Date.now())) => {
      // 1. Natychmiastowy optimistic update
      onOptimistic?.(payload)

      // 2. Toast z przyciskiem Cofnij
      toast(successMessage, {
        duration: undoDelay,
        action: {
          label: 'Cofnij',
          onClick: () => {
            // Oznacz jako cofnięte ZANIM timer odpali
            undoneActions.current.add(actionId)

            // Anuluj timer
            const timer = pendingTimers.current.get(actionId)
            if (timer) {
              clearTimeout(timer)
              pendingTimers.current.delete(actionId)
            }

            // Przywróć UI
            onUndo?.(payload)

            toast.info('Cofnięto')
          },
        },
      })

      // 3. Timer — po undoDelay wyślij do serwera (jeśli nie cofnięto)
      const timer = setTimeout(async () => {
        pendingTimers.current.delete(actionId)

        if (undoneActions.current.has(actionId)) {
          undoneActions.current.delete(actionId)
          return // cofnięto — nie rób nic
        }

        try {
          await action(payload)
        } catch (err) {
          // Błąd serwera — rollback UI
          onUndo?.(payload)
          toast.error(err instanceof Error ? `${errorMessage}: ${err.message}` : errorMessage)
        }
      }, undoDelay)

      pendingTimers.current.set(actionId, timer)

      // Zwróć actionId do zarządzania z zewnątrz (np. do testów)
      return actionId
    },
    [action, onOptimistic, onUndo, undoDelay, successMessage, errorMessage]
  )

  return { execute }
}