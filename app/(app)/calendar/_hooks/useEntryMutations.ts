'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MUTATION_KEYS, QUERY_KEYS } from '@/lib/query'
import {
  deleteWorkEntry,
  fetchCurrentUser,
  upsertWorkEntry,
} from '../_services/calendar.fetchers'
import type { EntryFormValues } from '../_domain/calendar.types'

interface SavePayload {
  date: string
  form: EntryFormValues
  workType: 'hourly' | 'piecework' | undefined
  existingId?: string
}

/**
 * Mutacje kalendarza — zgodne z pattern'em dashboardu (TanStack Mutation).
 * Po udanej operacji invaliduje QUERY_KEYS.calendar() → useCalendarData odświeża się.
 */
export function useEntryMutations({ onSuccess }: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient()

  const saveMutation = useMutation({
    mutationKey: MUTATION_KEYS.workEntry.update,
    mutationFn: async ({ date, form, workType, existingId }: SavePayload) => {
      const user = await fetchCurrentUser()
      const status = form.entryKind === 'predicted' ? 'worked' : form.status

      const isWorked = status === 'worked'
      const isHourly = isWorked && workType === 'hourly'
      const isPiecework = isWorked && workType === 'piecework'

      const payload = {
        user_id: user.id,
        date,
        status,
        entry_kind: form.entryKind,
        client_id: isWorked ? form.clientId || null : null,
        project_id:
          isWorked && form.projectId && form.projectId !== 'none'
            ? form.projectId
            : null,
        hours: isHourly ? form.hours : null,
        quantity: isPiecework ? form.quantityTo - form.quantityFrom : null,
        quantity_from: isPiecework ? form.quantityFrom : null,
        quantity_to: isPiecework ? form.quantityTo : null,
        notes: form.notes || null,
      }

      return upsertWorkEntry(payload, existingId)
    },
    onSuccess: (_entry, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.calendar() })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard() })
      toast.success(variables.existingId ? 'Zaktualizowano wpis' : 'Dodano wpis')
      onSuccess?.()
    },
    onError: () => toast.error('Błąd podczas zapisywania'),
  })

  const deleteMutation = useMutation({
    mutationKey: MUTATION_KEYS.workEntry.delete,
    mutationFn: (entryId: string) => deleteWorkEntry(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.calendar() })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard() })
      toast.success('Usunięto wpis')
      onSuccess?.()
    },
    onError: () => toast.error('Błąd podczas usuwania'),
  })

  return {
    saveEntry: saveMutation.mutate,
    deleteEntry: deleteMutation.mutate,
    isSaving: saveMutation.isPending || deleteMutation.isPending,
  }
}
