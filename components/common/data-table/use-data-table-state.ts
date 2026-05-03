'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { ColumnFiltersState } from '@tanstack/react-table'
import { parseAsInteger, parseAsJson, parseAsString, useQueryStates } from 'nuqs'
import { useLocalStorage } from '@/hooks/useLocalStorage'

const DISABLED_LS_KEY = '__data-table-state_disabled'
const DISABLED_URL_KEY = '__data-table-url_disabled'

export type DataTableState = {
  globalFilter: string
  columnFilters: ColumnFiltersState
  pageIndex: number
}

const DEFAULT_STATE: DataTableState = {
  globalFilter: '',
  columnFilters: [],
  pageIndex: 0,
}

function isColumnFiltersState(value: unknown): value is ColumnFiltersState {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        entry !== null &&
        typeof entry === 'object' &&
        'id' in (entry as Record<string, unknown>) &&
        typeof (entry as { id: unknown }).id === 'string',
    )
  )
}

function isPersistedState(value: unknown): value is DataTableState {
  if (value === null || typeof value !== 'object') return false
  const candidate = value as Partial<DataTableState>
  return (
    typeof candidate.globalFilter === 'string' &&
    typeof candidate.pageIndex === 'number' &&
    isColumnFiltersState(candidate.columnFilters)
  )
}

const columnFiltersParser = parseAsJson<ColumnFiltersState>((raw) => {
  return isColumnFiltersState(raw) ? raw : []
}).withDefault([])

function isStateEffectivelyEmpty(state: DataTableState): boolean {
  return (
    state.globalFilter === '' &&
    state.columnFilters.length === 0 &&
    state.pageIndex === 0
  )
}

/**
 * Owns the DataTable's persistable state (search, column filters, page index).
 *
 * Persistence model:
 * - When `urlStateKey` alone is set: URL is the only source of truth.
 *   Bookmarkable/shareable, but state is lost when navigating away and back.
 * - When `storageKey` alone is set: localStorage holds the state. Survives
 *   refresh and navigation, but not shareable.
 * - When **both** are set (recommended): URL is canonical when present;
 *   localStorage acts as a silent fallback. On mount, if the URL has no
 *   filter params, we rehydrate them from localStorage and write back to the
 *   URL — so users keep their view across navigations, refreshes, and even
 *   browser restarts, while individual links remain shareable.
 */
export function useDataTableState({
  urlStateKey,
  storageKey,
}: {
  urlStateKey?: string
  storageKey?: string
}): {
  state: DataTableState
  setGlobalFilter: (value: string) => void
  setColumnFilters: (
    value: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState),
  ) => void
  setPageIndex: (value: number) => void
  resetAll: () => void
} {
  const useUrl = Boolean(urlStateKey)
  const useStorage = Boolean(storageKey)

  const [persisted, setPersisted, { isHydrated: isStorageHydrated }] = useLocalStorage<DataTableState>(
    storageKey ?? DISABLED_LS_KEY,
    DEFAULT_STATE,
    { validate: isPersistedState },
  )

  // nuqs keys are namespaced via urlKeys so multiple tables on the same page
  // don't collide. When url sync is off we point keys at a sentinel namespace.
  const namespace = urlStateKey ?? DISABLED_URL_KEY
  const [urlQuery, setUrlQuery] = useQueryStates(
    {
      q: parseAsString.withDefault(''),
      p: parseAsInteger.withDefault(0),
      f: columnFiltersParser,
    },
    {
      history: 'replace',
      clearOnDefault: true,
      urlKeys: {
        q: `${namespace}_q`,
        p: `${namespace}_p`,
        f: `${namespace}_f`,
      },
    },
  )

  const state = useMemo<DataTableState>(() => {
    if (useUrl) {
      return {
        globalFilter: urlQuery.q,
        columnFilters: urlQuery.f,
        pageIndex: urlQuery.p,
      }
    }
    return persisted
  }, [useUrl, urlQuery.q, urlQuery.p, urlQuery.f, persisted])

  // One-time rehydration: if URL is empty on mount but localStorage has a
  // saved view, push it into the URL. We guard with a ref so navigations that
  // explicitly clear the URL don't get clobbered later in the session.
  const didRehydrateRef = useRef(false)
  useEffect(() => {
    if (!useUrl || !useStorage || !isStorageHydrated || didRehydrateRef.current) return
    didRehydrateRef.current = true

    const urlIsEmpty = isStateEffectivelyEmpty({
      globalFilter: urlQuery.q,
      columnFilters: urlQuery.f,
      pageIndex: urlQuery.p,
    })
    if (!urlIsEmpty) return
    if (isStateEffectivelyEmpty(persisted)) return

    void setUrlQuery({
      q: persisted.globalFilter,
      p: persisted.pageIndex,
      f: persisted.columnFilters,
    })
  }, [useUrl, useStorage, isStorageHydrated, urlQuery.q, urlQuery.f, urlQuery.p, persisted, setUrlQuery])

  // Mirror URL state into localStorage so the next visit can rehydrate.
  useEffect(() => {
    if (!useUrl || !useStorage || !isStorageHydrated || !didRehydrateRef.current) return
    setPersisted({
      globalFilter: urlQuery.q,
      columnFilters: urlQuery.f,
      pageIndex: urlQuery.p,
    })
  }, [useUrl, useStorage, isStorageHydrated, urlQuery.q, urlQuery.f, urlQuery.p, setPersisted])

  const setGlobalFilter = useCallback(
    (value: string) => {
      if (useUrl) {
        // Reset to first page on a new search (consistent with localStorage path).
        void setUrlQuery({ q: value, p: 0 })
      } else {
        setPersisted((prev) => ({ ...prev, globalFilter: value, pageIndex: 0 }))
      }
    },
    [useUrl, setUrlQuery, setPersisted],
  )

  const setColumnFilters = useCallback(
    (value: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => {
      if (useUrl) {
        const next = typeof value === 'function' ? value(urlQuery.f) : value
        void setUrlQuery({ f: next, p: 0 })
      } else {
        setPersisted((prev) => {
          const next = typeof value === 'function' ? value(prev.columnFilters) : value
          return { ...prev, columnFilters: next, pageIndex: 0 }
        })
      }
    },
    [useUrl, urlQuery.f, setUrlQuery, setPersisted],
  )

  const setPageIndex = useCallback(
    (value: number) => {
      if (useUrl) {
        void setUrlQuery({ p: value })
      } else {
        setPersisted((prev) => ({ ...prev, pageIndex: value }))
      }
    },
    [useUrl, setUrlQuery, setPersisted],
  )

  const resetAll = useCallback(() => {
    if (useUrl) {
      void setUrlQuery({ q: '', p: 0, f: [] })
    }
    if (useStorage) {
      setPersisted(DEFAULT_STATE)
    }
  }, [useUrl, useStorage, setUrlQuery, setPersisted])

  return { state, setGlobalFilter, setColumnFilters, setPageIndex, resetAll }
}
