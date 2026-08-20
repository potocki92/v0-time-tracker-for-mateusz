'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MUTATION_KEYS, QUERY_KEYS } from '@/lib/query'
import type { ProjectFormData } from '@/lib/types'
import {
  createProjectAction,
  deleteProjectAction,
  updateProjectAction,
} from '../actions'

type SaveArgs = {
  editingId: string | null
  formData: ProjectFormData
}

/**
 * Save (create / update) and remove mutations for a project.
 * Both invalidate QUERY_KEYS.projectsData() so derived KPIs and
 * lists re-compute automatically after a successful round-trip.
 */
export function useProjectMutations() {
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectsData() })

  const save = useMutation({
    mutationKey: MUTATION_KEYS.project.update,
    mutationFn: async ({ editingId, formData }: SaveArgs) => {
      if (!formData.name.trim()) {
        throw new Error('Nazwa projektu jest wymagana')
      }
      if (editingId) await updateProjectAction(editingId, formData)
      else await createProjectAction(formData)

      return { editingId }
    },
    onSuccess: async ({ editingId }) => {
      toast.success(editingId ? 'Projekt został zaktualizowany' : 'Projekt został dodany')
      await invalidate()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Nie udało się zapisać projektu')
    },
  })

  const remove = useMutation({
    mutationKey: MUTATION_KEYS.project.delete,
    mutationFn: (id: string) => deleteProjectAction(id),
    onSuccess: async () => {
      toast.success('Projekt został usunięty')
      await invalidate()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Nie udało się usunąć projektu')
    },
  })

  return { save, remove }
}
