'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  selectFilteredRows,
  selectProjectListRows,
} from '../types/projects.selectors'
import type {
  ProjectListRow,
  ProjectStatusFilter,
  ProjectsData,
  ProjectsFiltersState,
} from '../types/projects.types'

type UseProjectsFiltersResult = {
  search: string
  status: ProjectStatusFilter
  setSearch: (value: string) => void
  setStatus: (value: ProjectStatusFilter) => void
  reset: () => void
  isFiltering: boolean
  rows: ProjectListRow[]
  totalRows: number
}

export function useProjectsFilters(data: ProjectsData): UseProjectsFiltersResult {
  const [filters, setFilters] = useState<ProjectsFiltersState>({
    search: '',
    status: 'all',
  })

  const allRows = useMemo(() => selectProjectListRows(data), [data])
  const rows = useMemo(() => selectFilteredRows(allRows, filters), [allRows, filters])

  const setSearch = useCallback(
    (value: string) => setFilters((prev) => ({ ...prev, search: value })),
    [],
  )

  const setStatus = useCallback(
    (value: ProjectStatusFilter) => setFilters((prev) => ({ ...prev, status: value })),
    [],
  )

  const reset = useCallback(() => setFilters({ search: '', status: 'all' }), [])

  return {
    search: filters.search,
    status: filters.status,
    setSearch,
    setStatus,
    reset,
    isFiltering: filters.search.trim().length > 0 || filters.status !== 'all',
    rows,
    totalRows: allRows.length,
  }
}
