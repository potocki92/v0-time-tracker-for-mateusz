'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  ColumnOrderState,
  ColumnSizingState,
  VisibilityState,
} from '@tanstack/react-table'
import type { InvoicesTableSettings } from '../_domain'

type TableSettings = InvoicesTableSettings

interface UseTableSettingsOptions {
  storageKey: string
  defaults: TableSettings
}

interface UseTableSettingsReturn {
  columnVisibility: VisibilityState
  columnSizing: ColumnSizingState
  columnOrder: ColumnOrderState
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>
  setColumnSizing: React.Dispatch<React.SetStateAction<ColumnSizingState>>
  setColumnOrder: React.Dispatch<React.SetStateAction<ColumnOrderState>>
  resetSettings: () => void
  isHydrated: boolean
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseStoredSettings(raw: string | null, defaults: TableSettings): TableSettings {
  if (!raw) return defaults

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!isPlainObject(parsed)) return defaults

    const columnVisibility = isPlainObject(parsed.columnVisibility)
      ? (parsed.columnVisibility as VisibilityState)
      : defaults.columnVisibility

    const columnSizing = isPlainObject(parsed.columnSizing)
      ? (parsed.columnSizing as ColumnSizingState)
      : defaults.columnSizing

    const columnOrder = Array.isArray(parsed.columnOrder)
      ? (parsed.columnOrder.filter((id): id is string => typeof id === 'string') as ColumnOrderState)
      : defaults.columnOrder

    return { columnVisibility, columnSizing, columnOrder }
  } catch {
    return defaults
  }
}

export function useTableSettings({
  storageKey,
  defaults,
}: UseTableSettingsOptions): UseTableSettingsReturn {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    defaults.columnVisibility,
  )
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(defaults.columnSizing)
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(defaults.columnOrder)
  const [isHydrated, setIsHydrated] = useState(false)
  const defaultsRef = useRef(defaults)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = parseStoredSettings(
      window.localStorage.getItem(storageKey),
      defaultsRef.current,
    )
    setColumnVisibility(stored.columnVisibility)
    setColumnSizing(stored.columnSizing)
    setColumnOrder(stored.columnOrder)
    setIsHydrated(true)
  }, [storageKey])

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return

    const payload: TableSettings = { columnVisibility, columnSizing, columnOrder }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload))
    } catch {
      // Quota exceeded or private mode - ignore, settings stay in-memory.
    }
  }, [isHydrated, storageKey, columnVisibility, columnSizing, columnOrder])

  const resetSettings = useCallback(() => {
    setColumnVisibility(defaultsRef.current.columnVisibility)
    setColumnSizing(defaultsRef.current.columnSizing)
    setColumnOrder(defaultsRef.current.columnOrder)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey)
    }
  }, [storageKey])

  return {
    columnVisibility,
    columnSizing,
    columnOrder,
    setColumnVisibility,
    setColumnSizing,
    setColumnOrder,
    resetSettings,
    isHydrated,
  }
}
