'use client'

import type { ColumnOrderState, ColumnSizingState } from '@tanstack/react-table'
import { useLocalStorage } from '@/hooks/useLocalStorage'

const DISABLED_LAYOUT_KEY = '__data-table-layout_disabled'

export type DataTableLayoutState = {
  columnSizing: ColumnSizingState
  columnOrder: ColumnOrderState
}

export function useDataTableLayoutStorage(storageKey?: string) {
  const [layoutState, setLayoutState] = useLocalStorage<DataTableLayoutState>(
    storageKey ? `${storageKey}:layout` : DISABLED_LAYOUT_KEY,
    { columnSizing: {}, columnOrder: [] },
  )

  const persistLayout = storageKey ? setLayoutState : undefined

  return {
    layoutState,
    persistLayout,
  }
}
