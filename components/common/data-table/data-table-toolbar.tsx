'use client'

import type { RowData } from '@tanstack/react-table'
import { Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DataTableToolbarProps } from './types'
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
        <div className="relative max-w-lg flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(event) => onGlobalFilterChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 border-zinc-300/60 bg-background pl-8"
          />
        </div>

        <div className="flex items-center gap-2">
          {onDeleteSelected && (
            <Button type="button" variant="outline" size="sm" className="h-9 gap-1" onClick={onDeleteSelected} disabled={selectedCount === 0}>
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

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => {
          const column = table.getColumn(filter.columnId)
          if (!column) return null

          const value = (column.getFilterValue() as string | undefined) ?? 'all'

          if (filter.type === 'chips') {
            return (
              <div key={filter.columnId} className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">{filter.label}</span>
                <div className="inline-flex h-9 items-center gap-1 rounded-lg bg-muted/40 p-1">
                  {filter.options.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-md px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      data-state={value === option.value ? 'active' : 'inactive'}
                      onClick={() => column.setFilterValue(option.value === 'all' ? undefined : option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            )
          }

          return (
            <Select
              key={filter.columnId}
              value={value}
              onValueChange={(next) => column.setFilterValue(next === 'all' ? undefined : next)}
            >
              <SelectTrigger className="h-9 w-[210px] rounded-lg border-border/60 bg-muted/20">
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
          )
        })}
      </div>
    </div>
  )
}
