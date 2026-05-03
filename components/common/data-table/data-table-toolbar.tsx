'use client'

import type { Column, RowData } from '@tanstack/react-table'
import { FilterX, Plus, Search, Trash2, X } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import type {
  DataTableDateRangeFilter,
  DataTableFilter,
  DataTableNumberRangeFilter,
  DataTableSelectFilter,
  DataTableToolbarProps,
} from './types'
import { DataTableColumnsMenu } from './data-table-columns-menu'

const SEARCH_DEBOUNCE_MS = 300

function isDateRangeFilter(filter: DataTableFilter): filter is DataTableDateRangeFilter {
  return filter.type === 'dateRange'
}

function isNumberRangeFilter(filter: DataTableFilter): filter is DataTableNumberRangeFilter {
  return filter.type === 'numberRange'
}

function isSelectFilter(filter: DataTableFilter): filter is DataTableSelectFilter {
  return filter.type !== 'dateRange' && filter.type !== 'numberRange'
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return iso
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed)
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

function NumberRangeColumnFilter({
  column,
  filter,
}: {
  column: Column<RowData>
  filter: DataTableNumberRangeFilter
}) {
  const [min, max] =
    (column.getFilterValue() as [number | null, number | null] | undefined) ?? [null, null]
  const id = `dt-numrange-${column.id}`

  function update(next: [number | null, number | null]) {
    const [nMin, nMax] = next
    if (nMin == null && nMax == null) {
      column.setFilterValue(undefined)
    } else {
      column.setFilterValue(next)
    }
  }

  function parse(raw: string): number | null {
    if (raw === '') return null
    const num = Number(raw)
    return Number.isFinite(num) ? num : null
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground" id={`${id}-label`}>
        {filter.label}
      </span>
      <div className="flex items-center gap-1.5" aria-labelledby={`${id}-label`}>
        <Input
          type="number"
          inputMode="decimal"
          step={filter.step ?? 1}
          value={min ?? ''}
          onChange={(event) => update([parse(event.target.value), max])}
          placeholder={filter.minPlaceholder ?? 'min'}
          className="h-9 w-[110px]"
          aria-label={`${filter.label} od`}
        />
        <span className="text-xs text-muted-foreground" aria-hidden>
          –
        </span>
        <Input
          type="number"
          inputMode="decimal"
          step={filter.step ?? 1}
          value={max ?? ''}
          onChange={(event) => update([min, parse(event.target.value)])}
          placeholder={filter.maxPlaceholder ?? 'max'}
          className="h-9 w-[110px]"
          aria-label={`${filter.label} do`}
        />
        {filter.unit && (
          <span className="text-xs text-muted-foreground" aria-hidden>
            {filter.unit}
          </span>
        )}
        {(min != null || max != null) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => update([null, null])}
            aria-label={`Wyczyść ${filter.label.toLowerCase()}`}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

type ActiveFilterChip = {
  key: string
  label: string
  onClear: () => void
}

function describeActiveFilters<TData extends RowData>(
  filters: DataTableFilter[],
  table: DataTableToolbarProps<TData>['table'],
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = []

  for (const filter of filters) {
    const column = table.getColumn(filter.columnId)
    if (!column) continue
    const value = column.getFilterValue()
    if (value === undefined || value === null) continue

    if (isDateRangeFilter(filter)) {
      const [from, to] = (value as [string | null, string | null]) ?? [null, null]
      if (!from && !to) continue
      const range = `${formatDate(from) || '—'} → ${formatDate(to) || '—'}`
      chips.push({
        key: `${filter.columnId}-range`,
        label: `${filter.label}: ${range}`,
        onClear: () => column.setFilterValue(undefined),
      })
      continue
    }

    if (isNumberRangeFilter(filter)) {
      const [min, max] = (value as [number | null, number | null]) ?? [null, null]
      if (min == null && max == null) continue
      const minLabel = min == null ? '—' : String(min)
      const maxLabel = max == null ? '—' : String(max)
      const unit = filter.unit ? ` ${filter.unit}` : ''
      chips.push({
        key: `${filter.columnId}-numrange`,
        label: `${filter.label}: ${minLabel} – ${maxLabel}${unit}`,
        onClear: () => column.setFilterValue(undefined),
      })
      continue
    }

    if (isSelectFilter(filter)) {
      const stringValue = String(value)
      if (!stringValue || stringValue === 'all') continue
      const option = filter.options.find((opt) => opt.value === stringValue)
      chips.push({
        key: `${filter.columnId}-${stringValue}`,
        label: `${filter.label}: ${option?.label ?? stringValue}`,
        onClear: () => column.setFilterValue(undefined),
      })
    }
  }

  return chips
}

export function DataTableToolbar<TData extends RowData>({
  table,
  globalFilter,
  onGlobalFilterChange,
  filters,
  searchPlaceholder,
  selectedCount,
  onAddRow,
  onDeleteSelected,
  onResetAll,
}: DataTableToolbarProps<TData>) {
  // Recomputed every render: filter values come from `table` and aren't part
  // of toolbar props, so memoization with stable deps would mask updates.
  const activeChips = describeActiveFilters(filters, table)
  const hasActiveFilters = activeChips.length > 0 || globalFilter.length > 0

  function handleClearAll() {
    if (onResetAll) {
      onResetAll()
      return
    }
    // Fallback: clear column filters + global filter individually.
    for (const chip of activeChips) chip.onClear()
    if (globalFilter) onGlobalFilterChange('')
  }

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

          if (isNumberRangeFilter(filter)) {
            return (
              <NumberRangeColumnFilter
                key={filter.columnId}
                column={column as Column<RowData>}
                filter={filter}
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

      {hasActiveFilters && (
        <div
          className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/20 px-2.5 py-2"
          aria-live="polite"
        >
          <span className="text-xs font-medium text-muted-foreground">
            Aktywne filtry
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
              {activeChips.length + (globalFilter ? 1 : 0)}
            </Badge>
          </span>
          {globalFilter && (
            <Badge
              variant="outline"
              className="h-7 gap-1 rounded-full bg-background px-2 text-xs"
            >
              <span className="text-muted-foreground">Szukaj:</span>
              <span className="max-w-[180px] truncate">{globalFilter}</span>
              <button
                type="button"
                onClick={() => onGlobalFilterChange('')}
                className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Wyczyść wyszukiwanie"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}
          {activeChips.map((chip) => (
            <Badge
              key={chip.key}
              variant="outline"
              className="h-7 gap-1 rounded-full bg-background px-2 text-xs"
            >
              <span className="max-w-[260px] truncate">{chip.label}</span>
              <button
                type="button"
                onClick={chip.onClear}
                className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label={`Wyczyść: ${chip.label}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-7 gap-1 px-2 text-xs"
            onClick={handleClearAll}
          >
            <FilterX className="size-3.5" />
            Wyczyść wszystkie
          </Button>
        </div>
      )}
    </div>
  )
}
