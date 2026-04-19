'use client'

import { useState } from 'react'
import type { Project } from '@/lib/types'
import {
  useProjectForm,
  useProjectMutations,
  useProjectStats,
  useProjectsData,
} from '../_hooks'
import { ProjectsHeader } from './ProjectsHeader'
import { ProjectStats } from './card/ProjectStats'
import { ProjectsDataTable } from './list/ProjectsDataTable'
import { ProjectsEmpty } from './list/ProjectsEmpty'
import { ProjectFormDialog } from './form/ProjectFormDialog'
import { ProjectDeleteDialog } from './form/ProjectDeleteDialog'
import { ProjectsListBoundary, ProjectsStatsBoundary } from './errors'

export function ProjectsContent() {
  const { data } = useProjectsData()
  const { projects, clients } = data

  const stats = useProjectStats(projects)
  const form = useProjectForm(clients)
  const { save, remove } = useProjectMutations()

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  const handleSubmit = () => {
    save.mutate(
      { editingId: form.editing?.id ?? null, formData: form.formData },
      {
        onSuccess: () => form.close(),
      },
    )
  }

  const handleDeleteConfirm = () => {
    if (!projectToDelete) return
    remove.mutate(projectToDelete.id, {
      onSuccess: () => setProjectToDelete(null),
    })
  }

  return (
    <div className="container space-y-6 px-4 py-6">
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
            onClearFilters={() => {}}
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
    </div>
  )
}
