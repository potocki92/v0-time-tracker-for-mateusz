'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import {
  CURRENCY_FILTER_OPTIONS,
  WORK_TYPE_FILTER_OPTIONS,
} from '../_domain/clients.constants'
import type {
  ClientsCurrencyFilter,
  ClientsWorkTypeFilter,
  ClientWithStats,
} from '../_domain/clients.types'
import { ClientCard } from './ClientCard'

interface Props {
  clients: ClientWithStats[]
  workTypeFilter: ClientsWorkTypeFilter
  onWorkTypeFilterChange: (value: ClientsWorkTypeFilter) => void
  currencyFilter: ClientsCurrencyFilter
  onCurrencyFilterChange: (value: ClientsCurrencyFilter) => void
  onClearFilters: () => void
  onEdit: (client: ClientWithStats) => void
  onDelete: (client: ClientWithStats) => void
  onShowHistory: (client: ClientWithStats) => void
}

const PAGE_SIZE = 12

export function ClientsMobileList({
  clients,
  workTypeFilter,
  onWorkTypeFilterChange,
  currencyFilter,
  onCurrencyFilterChange,
  onClearFilters,
  onEdit,
  onDelete,
  onShowHistory,
}: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [clients.length, workTypeFilter, currencyFilter])

  const activeCount =
    (workTypeFilter !== 'all' ? 1 : 0) + (currencyFilter !== 'all' ? 1 : 0)
  const forceOpen = activeCount > 0
  const open = filtersOpen || forceOpen

  const shown = clients.slice(0, visibleCount)
  const hasMore = clients.length > visibleCount

  return (
    <div className="space-y-3">
      <Collapsible open={open} onOpenChange={setFiltersOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="h-11 w-full justify-between gap-2 rounded-xl border-border/60 bg-card text-sm font-medium text-muted-foreground"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="size-4" />
              Filtruj
              {activeCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-2 text-[11px]">
                  {activeCount}
                </Badge>
              )}
            </span>
            <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
          <div className="mt-2 space-y-3 rounded-xl border border-border/60 bg-card p-3">
            <FilterChipsRow
              label="Typ rozliczenia"
              options={WORK_TYPE_FILTER_OPTIONS}
              value={workTypeFilter}
              onChange={onWorkTypeFilterChange}
            />
            <FilterChipsRow
              label="Waluta"
              options={CURRENCY_FILTER_OPTIONS}
              value={currencyFilter}
              onChange={onCurrencyFilterChange}
            />
            {activeCount > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="h-8 text-xs"
                >
                  Wyczyść filtry
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <ul className="space-y-2.5">
        {shown.map((client) => (
          <li key={client.id}>
            <ClientCard
              client={client}
              onEdit={onEdit}
              onDelete={onDelete}
              onShowHistory={onShowHistory}
            />
          </li>
        ))}
      </ul>

      {hasMore && (
        <Button
          variant="outline"
          className="h-11 w-full rounded-xl"
          onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
        >
          Pokaż więcej ({clients.length - visibleCount})
        </Button>
      )}
    </div>
  )
}

interface FilterChipsRowProps<T extends string> {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

function FilterChipsRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: FilterChipsRowProps<T>) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
        role="radiogroup"
        aria-label={label}
      >
        {options.map((opt) => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted',
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
