'use client'

import type { Column, RowData } from '@tanstack/react-table'
import { Plus, Search, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  DataTableDateRangeFilter,
  DataTableFilter,
  DataTableSelectFilter,
  DataTableToolbarProps,
} from './types'

const SEARCH_DEBOUNCE_MS = 300

function isDateRangeFilter(filter: DataTableFilter): filter is DataTableDateRangeFilter {
  return filter.type === 'dateRange'
}

function isSelectFilter(filter: DataTableFilter): filter is DataTableSelectFilter {
  return filter.type !== 'dateRange'
}

function DebouncedSearchInput({
  value,
  onChange,
  placeholder,
  debounceMs = SEARCH_DEBOUNCE_MS,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  debounceMs?: number
}) {
  const [draft, setDraft] = useState(value)
  const lastEmittedRef = useRef(value)

  // Keep the input in sync if the upstream value changes (URL/storage rehydrate).
  useEffect(() => {
    if (value !== lastEmittedRef.current) {
      setDraft(value)
      lastEmittedRef.current = value
    }
  }, [value])

  useEffect(() => {
    if (draft === lastEmittedRef.current) return
    const handle = window.setTimeout(() => {
      lastEmittedRef.current = draft
      onChange(draft)
    }, debounceMs)
    return () => window.clearTimeout(handle)
  }, [draft, debounceMs, onChange])

  return (
    <div className="relative max-w-lg flex-1" role="search">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        className="h-9 border-zinc-300/60 bg-background pl-8 pr-8"
        aria-label={placeholder}
      />
      {draft && (
        <button
          type="button"
          onClick={() => setDraft('')}
          className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Wyczyść wyszukiwanie"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

function DateRangeColumnFilter({
  column,
  label,
}: {
  column: Column<RowData>
  label: string
}) {
  const [from, to] = (column.getFilterValue() as [string | null, string | null] | undefined) ?? [null, null]
  const id = `dt-range-${column.id}`

  function update(next: [string | null, string | null]) {
    const [nFrom, nTo] = next
    if (!nFrom && !nTo) {
      column.setFilterValue(undefined)
    } else {
      column.setFilterValue(next)
    }
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground" id={`${id}-label`}>
        {label}
      </span>
      <div className="flex items-center gap-1.5" aria-labelledby={`${id}-label`}>
        <Input
          type="date"
          value={from ?? ''}
          onChange={(event) => update([event.target.value || null, to])}
          className="h-9 w-[150px]"
          aria-label={`${label} od`}
        />
        <span className="text-xs text-muted-foreground" aria-hidden>
          –
        </span>
        <Input
          type="date"
          value={to ?? ''}
          onChange={(event) => update([from, event.target.value || null])}
          className="h-9 w-[150px]"
          aria-label={`${label} do`}
        />
        {(from || to) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => update([null, null])}
            aria-label={`Wyczyść ${label.toLowerCase()}`}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

import { DataTableColumnsMenu } from './data-table-columns-menu'

export function DataTableToolbar<TData extends RowData>({
  table,
  globalFilter,
  onGlobalFilterChange,
  filters,
  searchPlaceholder,
  selectedCount,
  onAddRow,
  onDeleteSelected,
}: DataTableToolbarProps<TData>) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <DebouncedSearchInput
          value={globalFilter}
          onChange={onGlobalFilterChange}
          placeholder={searchPlaceholder}
        />

        <div className="flex items-center gap-2">
          {onDeleteSelected && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1"
              onClick={onDeleteSelected}
              disabled={selectedCount === 0}
              aria-label={`Usuń zaznaczone (${selectedCount})`}
            >
              <Trash2 className="size-4" /> Usuń ({selectedCount})
            </Button>
          )}
          {onAddRow && (
            <Button type="button" size="sm" className="h-9 gap-1" onClick={onAddRow}>
              <Plus className="size-4" /> Dodaj
            </Button>
          )}
          <DataTableColumnsMenu table={table} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {filters.map((filter) => {
          const column = table.getColumn(filter.columnId)
          if (!column) return null

          if (isDateRangeFilter(filter)) {
            return (
              <DateRangeColumnFilter
                key={filter.columnId}
                column={column as Column<RowData>}
                label={filter.label}
              />
            )
          }

          if (!isSelectFilter(filter)) return null

          const value = (column.getFilterValue() as string | undefined) ?? 'all'

          if (filter.type === 'chips') {
            return (
              <div
                key={filter.columnId}
                className="flex min-w-0 max-w-full flex-wrap items-center gap-2"
                role="group"
                aria-label={filter.label}
              >
                <span className="text-xs font-medium text-muted-foreground">{filter.label}</span>
                <div className="inline-flex h-9 max-w-full flex-wrap items-center gap-1 overflow-hidden rounded-lg bg-muted/40 p-1">
                  {filter.options.map((option) => {
                    const isActive = value === option.value
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 rounded-md px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        data-state={isActive ? 'active' : 'inactive'}
                        aria-pressed={isActive}
                        onClick={() => column.setFilterValue(option.value === 'all' ? undefined : option.value)}
                      >
                        {option.label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )
          }

          return (
            <div key={filter.columnId} className="min-w-0 flex-1 sm:flex-none sm:w-[210px]">
              <Select
                value={value}
                onValueChange={(next) => column.setFilterValue(next === 'all' ? undefined : next)}
              >
                <SelectTrigger
                  className="h-9 w-full min-w-0 rounded-lg border-border/60 bg-muted/20"
                  aria-label={`Filtruj: ${filter.label}`}
                >
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{filter.allLabel ?? `Wszystkie: ${filter.label.toLowerCase()}`}</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        })}
      </div>
    </div>
  )
}
