'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MUTATION_KEYS, QUERY_KEYS } from '@/lib/query'
import {
  deleteWorkEntryAction,
  saveWorkEntryAction,
  type SaveWorkEntryInput,
} from '../actions'

/**
 * Mutacje kalendarza — zgodne z pattern'em dashboardu (TanStack Mutation).
 * Zapis robi Server Action (walidacja Zodem + `user_id` z sesji serwerowej);
 * po udanej operacji invaliduje QUERY_KEYS.calendar() → useCalendarData odświeża się.
 */
export function useEntryMutations({ onSuccess }: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient()

  const saveMutation = useMutation({
    mutationKey: MUTATION_KEYS.workEntry.update,
    mutationFn: (input: SaveWorkEntryInput) => saveWorkEntryAction(input),
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
    mutationFn: (entryId: string) => deleteWorkEntryAction(entryId),
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
