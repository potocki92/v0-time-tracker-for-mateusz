'use client'

import { useMemo, useState } from 'react'
import { selectFilteredProjects } from '../_domain/projects.selectors'
import type { ProjectStatusFilter, ProjectsData } from '../_domain/projects.types'

export function useProjectFilters(data: ProjectsData) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ProjectStatusFilter>('all')

  const filtered = useMemo(
    () => selectFilteredProjects(data, { search, status }),
    [data, search, status],
  )

  return {
    search,
    status,
    setSearch,
    setStatus,
    filtered,
    isFiltering: search.trim().length > 0 || status !== 'all',
  }
}
