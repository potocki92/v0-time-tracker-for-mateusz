'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import {
  selectFilteredProjects,
  selectSortedProjects,
} from '../_domain/projects.selectors'
import type {
  ProjectPriority,
  ProjectStatusFilter,
  ProjectsData,
  ProjectsSortDirection,
  ProjectsSortKey,
} from '../_domain/projects.types'

const STATUS_VALUES = ['all', 'in_progress', 'planned', 'on_hold', 'completed'] as const satisfies readonly ProjectStatusFilter[]
const PRIORITY_VALUES = ['all', 'low', 'medium', 'high'] as const
type PriorityFilter = (typeof PRIORITY_VALUES)[number]

type PersistedFilters = {
  search: string
  status: ProjectStatusFilter
  priority: PriorityFilter
}

const DEFAULTS: PersistedFilters = { search: '', status: 'all', priority: 'all' }
const STORAGE_KEY = 'projects-filters-v1'

function isPersistedShape(value: unknown): value is PersistedFilters {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.search === 'string' &&
    STATUS_VALUES.includes(v.status as ProjectStatusFilter) &&
    PRIORITY_VALUES.includes(v.priority as PriorityFilter)
  )
}

/**
 * URL-synced filters with localStorage fallback. URL is the source of truth
 * for the current view; localStorage hydrates on cold load so returning users
 * see the same filters they left with.
 */
export function useProjectFilters(data: ProjectsData) {
  const [query, setQuery] = useQueryStates(
    {
      search: parseAsString.withDefault(DEFAULTS.search),
      status: parseAsStringLiteral(STATUS_VALUES).withDefault(DEFAULTS.status),
      priority: parseAsStringLiteral(PRIORITY_VALUES).withDefault(DEFAULTS.priority),
    },
    { history: 'replace', clearOnDefault: true },
  )

  const [persisted, setPersisted, { isHydrated }] = useLocalStorage<PersistedFilters>(
    STORAGE_KEY,
    DEFAULTS,
    { validate: isPersistedShape },
  )

  // Cold-load hydration: if the URL has no filter params, rehydrate from storage.
  useEffect(() => {
    if (!isHydrated) return
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const urlIsEmpty = !params.has('search') && !params.has('status') && !params.has('priority')

    if (urlIsEmpty && (persisted.search || persisted.status !== 'all' || persisted.priority !== 'all')) {
      void setQuery({
        search: persisted.search,
        status: persisted.status,
        priority: persisted.priority,
      })
    }
    // Only run on mount post-hydration; subsequent persistence handled by the next effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated])

  // Mirror live URL state into storage so it survives across sessions.
  useEffect(() => {
    if (!isHydrated) return
    setPersisted({ search: query.search, status: query.status, priority: query.priority })
  }, [isHydrated, query.search, query.status, query.priority, setPersisted])

  const setSearch = useCallback((value: string) => setQuery({ search: value }), [setQuery])
  const setStatus = useCallback((value: ProjectStatusFilter) => setQuery({ status: value }), [setQuery])
  const setPriority = useCallback((value: PriorityFilter) => setQuery({ priority: value }), [setQuery])
  const reset = useCallback(() => {
    void setQuery({ search: DEFAULTS.search, status: DEFAULTS.status, priority: DEFAULTS.priority })
  }, [setQuery])

  const filtered = useMemo(
    () => selectFilteredProjects(data, { search: query.search, status: query.status, priority: query.priority }),
    [data, query.search, query.status, query.priority],
  )

  const sortKey: ProjectsSortKey = 'end_date'
  const sortDirection: ProjectsSortDirection = 'asc'
  const visible = useMemo(
    () => selectSortedProjects(filtered, data.clients, sortKey, sortDirection),
    [filtered, data.clients],
  )

  const isFiltering = query.search.trim().length > 0 || query.status !== 'all' || query.priority !== 'all'
  const activeFilterCount =
    (query.search.trim().length > 0 ? 1 : 0) +
    (query.status !== 'all' ? 1 : 0) +
    (query.priority !== 'all' ? 1 : 0)

  return {
    search: query.search,
    status: query.status,
    priority: query.priority as ProjectPriority | 'all',
    setSearch,
    setStatus,
    setPriority,
    reset,
    filtered: visible,
    isFiltering,
    activeFilterCount,
  }
}

export type ProjectFiltersState = ReturnType<typeof useProjectFilters>
