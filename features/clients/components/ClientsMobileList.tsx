'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowDownUp, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LINEAR, SURFACE } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'
import {
  ACTIVITY_GROUP_LABELS,
  ACTIVITY_GROUP_ORDER,
  CURRENCY_FILTER_OPTIONS,
  SORT_OPTIONS,
  STATUS_FILTER_OPTIONS,
  WORK_TYPE_FILTER_OPTIONS,
} from '../domain/clients.constants'
import { deriveActivity } from '../domain/clients.selectors'
import type {
  ClientActivity,
  ClientsActivityFilter,
  ClientsCurrencyFilter,
  ClientsSortKey,
  ClientsWorkTypeFilter,
  ClientWithStats,
} from '../domain/clients.types'
import { ClientCard } from './ClientCard'

interface Props {
  clients: ClientWithStats[]
  workTypeFilter: ClientsWorkTypeFilter
  onWorkTypeFilterChange: (value: ClientsWorkTypeFilter) => void
  currencyFilter: ClientsCurrencyFilter
  onCurrencyFilterChange: (value: ClientsCurrencyFilter) => void
  activityFilter: ClientsActivityFilter
  onActivityFilterChange: (value: ClientsActivityFilter) => void
  sortKey: ClientsSortKey
  onSortChange: (value: ClientsSortKey) => void
  activeFilterCount: number
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
  activityFilter,
  onActivityFilterChange,
  sortKey,
  onSortChange,
  activeFilterCount,
  onClearFilters,
  onEdit,
  onDelete,
  onShowHistory,
}: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [clients.length, workTypeFilter, currencyFilter, activityFilter, sortKey])

  const forceOpen = activeFilterCount > 0
  const open = filtersOpen || forceOpen

  const shown = clients.slice(0, visibleCount)
  const hasMore = clients.length > visibleCount

  // Nagłówki grup mają sens tylko przy sortowaniu po świeżości — przy sortowaniu
  // po nazwie czy stawce rozbijałyby porządek, który użytkownik właśnie wybrał.
  const grouped = useMemo(() => {
    if (sortKey !== 'recent') return null
    const buckets = new Map<ClientActivity, ClientWithStats[]>()
    for (const client of shown) {
      const activity = deriveActivity(client)
      const bucket = buckets.get(activity)
      if (bucket) bucket.push(client)
      else buckets.set(activity, [client])
    }
    return ACTIVITY_GROUP_ORDER.filter((a) => buckets.has(a)).map((activity) => ({
      activity,
      items: buckets.get(activity)!,
    }))
  }, [shown, sortKey])

  return (
    <div className="space-y-3">
      <Collapsible open={open} onOpenChange={setFiltersOpen}>
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'h-11 flex-1 justify-between gap-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-white',
                LINEAR.border,
                LINEAR.surface,
                LINEAR.surfaceHover,
              )}
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="size-4" />
                Filtruj
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-2 text-2xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </span>
              <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>

          <Select value={sortKey} onValueChange={(v) => onSortChange(v as ClientsSortKey)}>
            <SelectTrigger
              className={cn(
                'h-11 w-[11.5rem] shrink-0 gap-1.5 rounded-xl text-sm text-zinc-300 [&>span]:truncate',
                LINEAR.border,
                LINEAR.surface,
              )}
              aria-label="Sortowanie listy klientów"
            >
              <ArrowDownUp className="size-4 shrink-0 text-zinc-400" aria-hidden />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <CollapsibleContent className="data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
          <div className={cn('mt-2 space-y-3 p-3', SURFACE.card)}>
            <FilterChipsRow
              label="Status"
              options={STATUS_FILTER_OPTIONS}
              value={activityFilter}
              onChange={onActivityFilterChange}
            />
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
            {activeFilterCount > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="h-9 text-xs text-zinc-400 hover:text-white"
                >
                  Wyczyść filtry
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {grouped ? (
        <div className="space-y-4">
          {grouped.map(({ activity, items }) => (
            <section key={activity} className="space-y-2.5">
              <SectionEyebrow as="h2" className="px-1">
                {ACTIVITY_GROUP_LABELS[activity]} {items.length}
              </SectionEyebrow>
              <ul className="space-y-2.5">
                {items.map((client) => (
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
            </section>
          ))}
        </div>
      ) : (
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
      )}

      {hasMore && (
        <Button
          variant="outline"
          className={cn(
            'h-11 w-full rounded-xl text-zinc-300 hover:text-white',
            LINEAR.border,
            LINEAR.surface,
            LINEAR.surfaceHover,
          )}
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
      <p className="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-zinc-400">
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
                'min-h-9 shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                active
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                  : 'border-hairline-strong bg-surface-3 text-zinc-400 hover:bg-surface-3 hover:text-zinc-200',
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
