'use client'

import { useCallback, useState } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import type { Project } from '@/lib/types'
import {
  useProjectFilters,
  useProjectForm,
  useProjectMutations,
  useProjectStats,
  useProjectsData,
} from '../_hooks'
import { ProjectsHeader } from './ProjectsHeader'
import { ProjectsFab } from './ProjectsFab'
import { ProjectStats } from './card/ProjectStats'
import { ProjectsDataTable } from './list/ProjectsDataTable'
import { ProjectsMobileAccordion } from './list/ProjectsMobileAccordion'
import { ProjectsEmpty } from './list/ProjectsEmpty'
import { ProjectFormDialog } from './form/ProjectFormDialog'
import { ProjectDeleteDialog } from './form/ProjectDeleteDialog'
import { ProjectsListBoundary, ProjectsStatsBoundary } from './errors'

export function ProjectsContent() {
  const { data } = useProjectsData()
  const { projects, clients } = data

  const isMobile = useIsMobile()
  const stats = useProjectStats(projects)
  const filters = useProjectFilters(data)
  const form = useProjectForm(clients)
  const { save, remove } = useProjectMutations()

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  const { editing, formData, close: closeForm } = form
  const handleSubmit = useCallback(() => {
    save.mutate(
      { editingId: editing?.id ?? null, formData },
      { onSuccess: () => closeForm() },
    )
  }, [editing, formData, closeForm, save])

  const handleDeleteConfirm = useCallback(() => {
    if (!projectToDelete) return
    remove.mutate(projectToDelete.id, {
      onSuccess: () => setProjectToDelete(null),
    })
  }, [projectToDelete, remove])

  return (
    <div
      className="container space-y-6 px-4 py-6 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-6"
    >
      <ProjectsHeader total={projects.length} onCreate={form.openCreate} />

      <ProjectsStatsBoundary>
        <ProjectStats {...stats} />
      </ProjectsStatsBoundary>

      <ProjectsListBoundary>
        {projects.length === 0 ? (
          <ProjectsEmpty
            hasProjects={false}
            search=""
            onCreate={form.openCreate}
            onClearFilters={filters.reset}
          />
        ) : isMobile ? (
          <ProjectsMobileAccordion
            data={filters.filtered}
            clients={clients}
            filters={filters}
            onEditProject={form.openEdit}
            onDeleteProject={setProjectToDelete}
          />
        ) : (
          <ProjectsDataTable
            data={projects}
            clients={clients}
            onAddProject={form.openCreate}
            onEditProject={form.openEdit}
            onDeleteProject={setProjectToDelete}
          />
        )}
      </ProjectsListBoundary>

      <ProjectFormDialog
        open={form.isOpen}
        isSaving={save.isPending}
        editing={form.editing}
        clients={clients}
        formData={form.formData}
        onOpenChange={form.setIsOpen}
        onChange={form.setFormData}
        onSubmit={handleSubmit}
      />

      <ProjectDeleteDialog
        project={projectToDelete}
        isDeleting={remove.isPending}
        onCancel={() => setProjectToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />

      <ProjectsFab onClick={form.openCreate} />
    </div>
  )
}
