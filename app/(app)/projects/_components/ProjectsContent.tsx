'use client'

import { useState } from 'react'
import type { Project } from '@/lib/types'
import {
  useProjectFilters,
  useProjectForm,
  useProjectMutations,
  useProjectStats,
  useProjectsData,
} from '../_hooks'
import { ProjectsHeader } from './ProjectsHeader'
import { ProjectsToolbar } from './ProjectsToolbar'
import { ProjectStats } from './card/ProjectStats'
import { ProjectsTable } from './list/ProjectsTable'
import { ProjectsEmpty } from './list/ProjectsEmpty'
import { ProjectFormDialog } from './form/ProjectFormDialog'
import { ProjectDeleteDialog } from './form/ProjectDeleteDialog'
import { ProjectsListBoundary, ProjectsStatsBoundary } from './errors'

export function ProjectsContent() {
  const { data } = useProjectsData()
  const { projects, clients, workEntries } = data

  const stats = useProjectStats(projects)
  const filters = useProjectFilters(data)
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

  const resetFilters = () => {
    filters.setSearch('')
    filters.setStatus('all')
  }

  return (
    <div className="container space-y-6 px-4 py-6">
      <ProjectsHeader total={projects.length} onCreate={form.openCreate} />

      <ProjectsStatsBoundary>
        <ProjectStats {...stats} />
      </ProjectsStatsBoundary>

      <ProjectsToolbar
        search={filters.search}
        status={filters.status}
        isFiltering={filters.isFiltering}
        onSearchChange={filters.setSearch}
        onStatusChange={filters.setStatus}
        onReset={resetFilters}
      />

      <ProjectsListBoundary>
        {filters.filtered.length === 0 ? (
          <ProjectsEmpty
            hasProjects={projects.length > 0}
            search={filters.search}
            onCreate={form.openCreate}
            onClearFilters={resetFilters}
          />
        ) : (
          <ProjectsTable
            projects={filters.filtered}
            clients={clients}
            workEntries={workEntries}
            sortKey={filters.sortKey}
            sortDirection={filters.sortDirection}
            onSort={filters.toggleSort}
            onEdit={form.openEdit}
            onDelete={setProjectToDelete}
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
