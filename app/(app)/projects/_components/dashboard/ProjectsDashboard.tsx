'use client'

import { ProjectsDashboardEmptyState } from './ProjectsDashboardEmptyState'
import { ProjectsDashboardList } from './ProjectsDashboardList'
import { ProjectsDashboardSearch } from './ProjectsDashboardSearch'
import type { ProjectsDashboardProps } from './types'
import { useProjectsDashboard } from './useProjectsDashboard'

export function ProjectsDashboard({ projects = [], onProjectSelect }: ProjectsDashboardProps) {
  const { query, setQuery, filteredProjects, hasProjects } = useProjectsDashboard(projects)

  return (
    <section aria-labelledby="projects-dashboard-heading" className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="projects-dashboard-heading" className="text-2xl font-semibold tracking-tight">
            Projekty
          </h2>
          <p className="text-sm text-muted-foreground">
            Śledź status projektów, postęp i ostatnie aktualizacje.
          </p>
        </div>

        <ProjectsDashboardSearch query={query} onQueryChange={setQuery} />
      </header>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        Wyświetlanie: {filteredProjects.length} z {projects.length} projektów
      </p>

      {!hasProjects ? (
        <ProjectsDashboardEmptyState message="Dodaj pierwszy projekt, aby rozpocząć śledzenie postępu." />
      ) : filteredProjects.length === 0 ? (
        <ProjectsDashboardEmptyState message="Spróbuj innej frazy lub wyczyść wyszukiwanie, aby zobaczyć wszystkie projekty." />
      ) : (
        <ProjectsDashboardList projects={filteredProjects} onProjectSelect={onProjectSelect} />
      )}
    </section>
  )
}
