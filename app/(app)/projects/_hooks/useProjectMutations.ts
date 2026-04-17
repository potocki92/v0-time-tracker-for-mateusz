'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MUTATION_KEYS, QUERY_KEYS } from '@/lib/query'
import type { ProjectFormData } from '@/lib/types'
import {
  createProject,
  deleteProject,
  fetchCurrentUser,
  toProjectPayload,
  updateProject,
} from '../_services/projects.fetchers'

type SaveArgs = {
  editingId: string | null
  formData: ProjectFormData
}

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
      const user = await fetchCurrentUser()
      const payload = toProjectPayload(user.id, formData)

      if (editingId) await updateProject(editingId, payload)
      else await createProject(payload)

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
    mutationFn: (id: string) => deleteProject(id),
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
