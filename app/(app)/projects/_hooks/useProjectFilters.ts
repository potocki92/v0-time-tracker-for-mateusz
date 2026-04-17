'use client'

import { useMemo, useState } from 'react'
import {
  selectFilteredProjects,
  selectSortedProjects,
} from '../_domain/projects.selectors'
import type {
  ProjectStatusFilter,
  ProjectsData,
  ProjectsSortDirection,
  ProjectsSortKey,
} from '../_domain/projects.types'

export function useProjectFilters(data: ProjectsData) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ProjectStatusFilter>('all')
  const [sortKey, setSortKey] = useState<ProjectsSortKey>('end_date')
  const [sortDirection, setSortDirection] = useState<ProjectsSortDirection>('asc')

  const filtered = useMemo(
    () => selectFilteredProjects(data, { search, status }),
    [data, search, status],
  )

  const visible = useMemo(
    () => selectSortedProjects(filtered, data.clients, sortKey, sortDirection),
    [filtered, data.clients, sortKey, sortDirection],
  )

  function toggleSort(key: ProjectsSortKey) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  return {
    search,
    status,
    setSearch,
    setStatus,
    sortKey,
    sortDirection,
    toggleSort,
    filtered: visible,
    isFiltering: search.trim().length > 0 || status !== 'all',
  }
}
