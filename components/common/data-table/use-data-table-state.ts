'use client'

import { useCallback, useEffect, useMemo } from 'react'
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

const columnFiltersParser = parseAsJson<ColumnFiltersState>((raw) => {
  return isColumnFiltersState(raw) ? raw : []
}).withDefault([])

/**
 * Owns the DataTable's persistable state (search, column filters, page index).
 *
 * - When `urlStateKey` is set, the URL is the source of truth and changes are
 *   synced via nuqs (bookmarkable, shareable). localStorage is bypassed.
 * - Otherwise, falls back to localStorage under `storageKey` (legacy behavior).
 *
 * Both backing stores are subscribed unconditionally to satisfy the rules of
 * hooks; only the active one is written to.
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
} {
  const useUrl = Boolean(urlStateKey)

  const [persisted, setPersisted] = useLocalStorage<DataTableState>(
    storageKey ?? DISABLED_LS_KEY,
    DEFAULT_STATE,
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

  // Migration path: if a user previously had filters in localStorage and the
  // page is later opened with `urlStateKey`, we don't auto-import — the URL is
  // canonical. We just leave localStorage alone (silently abandoned).
  useEffect(() => {
    if (!useUrl && storageKey && persisted.pageIndex < 0) {
      // defensive normalisation for malformed stored values
      setPersisted((prev) => ({ ...prev, pageIndex: 0 }))
    }
  }, [useUrl, storageKey, persisted.pageIndex, setPersisted])

  return { state, setGlobalFilter, setColumnFilters, setPageIndex }
}
