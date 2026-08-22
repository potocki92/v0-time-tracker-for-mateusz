'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppFooter } from '@/components/common/AppFooter'
import type { Project } from '@/lib/types'
import { useProjectForm } from '../hooks/useProjectForm'
import { useProjectMutations } from '../hooks/useProjectMutations'
import { useProjectsData } from '../hooks/useProjectsData'
import { ProjectsListBoundary, ProjectsStatsBoundary } from './errors'
import { ProjectDeleteDialog, ProjectFormDialog } from './form'
import {
  AllProjectsSection,
  BudgetUtilizationSection,
  FeaturedSection,
  HeaderSection,
  KpiSection,
  StatusBreakdownSection,
} from './sections'

/**
 * Linear-style dark composition for the Projects module.
 *
 * Stack (mobile-first, single column up to md):
 *   - HeaderSection ─ akcje (Export · Nowy projekt) portalowane do WorkspaceHeader
 *   - KpiSection ─ KPI grid (All / Active / Done / Total budget)
 *   - FeaturedSection ─ top priority active project, opens edit dialog
 *   - StatusBreakdownSection
 *   - BudgetUtilizationSection ─ portfolio burn vs contracted budget
 *   - AllProjectsSection ─ filterable list with row-level edit/delete
 *   - AppFooter
 *
 * Modal state lives here (single source of truth):
 *   - useProjectForm() ─ open/close + formData (create | edit)
 *   - useProjectMutations() ─ save + remove with toast feedback
 *
 * Quick action `/projects?new=1` (sidebar) auto-opens the create form
 * once and strips the param so deep-linking stays idempotent.
 */
export function ProjectsContent() {
  const { data } = useProjectsData()
  const { clients } = data

  const form = useProjectForm(clients)
  const { save, remove } = useProjectMutations()

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const quickAddTriggered = useRef(false)

  useEffect(() => {
    if (quickAddTriggered.current) return
    if (searchParams.get('new') !== '1') return
    quickAddTriggered.current = true
    form.openCreate()
    const params = new URLSearchParams(searchParams.toString())
    params.delete('new')
    const query = params.toString()
    router.replace(query ? `/projects?${query}` : '/projects', { scroll: false })
  }, [searchParams, form, router])

  const handleSubmit = () => {
    save.mutate(
      { editingId: form.editing?.id ?? null, formData: form.formData },
      { onSuccess: () => form.close() },
    )
  }

  const handleDeleteConfirm = () => {
    if (!projectToDelete) return
    remove.mutate(projectToDelete.id, {
      onSuccess: () => setProjectToDelete(null),
    })
  }

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <div className="mx-auto w-full max-w-2xl space-y-5 px-3 pb-28 pt-2 sm:px-4 md:max-w-5xl md:px-6 md:pb-10 md:pt-3 lg:px-8">
        <HeaderSection onCreate={form.openCreate} />

        <ProjectsStatsBoundary>
          <KpiSection />
        </ProjectsStatsBoundary>

        <FeaturedSection onEditProject={form.openEdit} />
        <StatusBreakdownSection />
        <BudgetUtilizationSection />

        <ProjectsListBoundary>
          <AllProjectsSection
            onEditProject={form.openEdit}
            onDeleteProject={setProjectToDelete}
          />
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

        <AppFooter />
      </div>
    </div>
  )
}
