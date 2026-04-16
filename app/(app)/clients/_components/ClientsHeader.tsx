'use client'

import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CURRENCY_FILTER_OPTIONS,
  WORK_TYPE_FILTER_OPTIONS,
} from '../_domain/clients.constants'
import type {
  ClientsCurrencyFilter,
  ClientsWorkTypeFilter,
} from '../_domain/clients.types'

type Props = {
  totalCount: number
  visibleCount: number
  search: string
  onSearchChange: (value: string) => void
  workTypeFilter: ClientsWorkTypeFilter
  onWorkTypeFilterChange: (value: ClientsWorkTypeFilter) => void
  currencyFilter: ClientsCurrencyFilter
  onCurrencyFilterChange: (value: ClientsCurrencyFilter) => void
  onAddClient: () => void
}

export function ClientsHeader({
  totalCount,
  visibleCount,
  search,
  onSearchChange,
  workTypeFilter,
  onWorkTypeFilterChange,
  currencyFilter,
  onCurrencyFilterChange,
  onAddClient,
}: Props) {
  const countLabel =
    visibleCount === totalCount
      ? `${totalCount} ${pluralize(totalCount)}`
      : `${visibleCount} z ${totalCount} ${pluralize(totalCount)}`

  return (
    <div className="sticky top-0 z-20 -mx-4 border-b bg-background/95 px-4 pb-4 pt-2 backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Klienci</h1>
          <p className="text-sm text-muted-foreground">{countLabel}</p>
        </div>
        <Button onClick={onAddClient} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Dodaj klienta
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Szukaj po nazwie, NIP, email..."
            className="pl-9"
          />
        </div>

        <Select
          value={workTypeFilter}
          onValueChange={(v) => onWorkTypeFilterChange(v as ClientsWorkTypeFilter)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WORK_TYPE_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currencyFilter}
          onValueChange={(v) => onCurrencyFilterChange(v as ClientsCurrencyFilter)}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCY_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function pluralize(count: number) {
  if (count === 1) return 'klient'
  const mod10  = count % 10
  const mod100 = count % 100
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'klientów'
  return 'klientów'
}
