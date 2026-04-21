import { useMemo, useState } from 'react'
import type { Project } from './types'

interface UseProjectsDashboardResult {
  query: string
  setQuery: (value: string) => void
  filteredProjects: Project[]
  hasProjects: boolean
}

export function useProjectsDashboard(projects: Project[]): UseProjectsDashboardResult {
  const [query, setQuery] = useState('')

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) return projects

    return projects.filter((project) =>
      (project?.title ?? '').toLowerCase().includes(normalizedQuery),
    )
  }, [projects, query])

  return {
    query,
    setQuery,
    filteredProjects,
    hasProjects: projects.length > 0,
  }
}
