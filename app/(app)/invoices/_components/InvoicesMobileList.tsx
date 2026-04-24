'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { displayInvoiceNumber } from '@/lib/finance/invoice-number'
import {
  INVOICE_STATUS_LABELS_PL,
  InvoiceStatus,
  deriveInvoiceStatus,
} from '@/lib/finance/invoice-status'
import type { Client, Invoice } from '@/lib/types'
import { InvoiceCard } from './InvoiceCard'

type StatusFilter = 'all' | InvoiceStatus

interface InvoicesMobileListProps {
  invoices: Invoice[]
  clients: Client[]
  onEdit: (invoice: Invoice) => void
  onDelete: (invoice: Invoice) => void
}

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Wszystkie' },
  { value: InvoiceStatus.DRAFT, label: INVOICE_STATUS_LABELS_PL.DRAFT },
  { value: InvoiceStatus.SENT, label: INVOICE_STATUS_LABELS_PL.SENT },
  { value: InvoiceStatus.PAID, label: INVOICE_STATUS_LABELS_PL.PAID },
  { value: InvoiceStatus.OVERDUE, label: INVOICE_STATUS_LABELS_PL.OVERDUE },
  { value: InvoiceStatus.CANCELLED, label: INVOICE_STATUS_LABELS_PL.CANCELLED },
]

export function InvoicesMobileList({ invoices, clients, onEdit, onDelete }: InvoicesMobileListProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [toolbarOpen, setToolbarOpen] = useState(false)

  const clientsById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients])
  const hasActiveFilters = query.trim().length > 0 || status !== 'all'
  const activeFilterCount = (query.trim() ? 1 : 0) + (status !== 'all' ? 1 : 0)

  const filteredInvoices = useMemo(() => {
    const q = query.trim().toLowerCase()
    return invoices.filter((invoice) => {
      if (status !== 'all' && deriveInvoiceStatus(invoice) !== status) return false
      if (!q) return true

      const client = invoice.client_id ? clientsById.get(invoice.client_id) : null
      const haystack = [
        displayInvoiceNumber(invoice),
        invoice.name,
        invoice.recipient ?? '',
        invoice.billing_period ?? '',
        client?.name ?? '',
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [clientsById, invoices, query, status])

  function resetFilters() {
    setQuery('')
    setStatus('all')
  }

  return (
    <div className="space-y-3">
      <Collapsible open={toolbarOpen || hasActiveFilters} onOpenChange={setToolbarOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="h-11 w-full justify-between gap-2 rounded-xl border-border/60 bg-card text-sm font-medium text-muted-foreground"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="size-4" />
              Szukaj i filtruj
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-2 text-[11px]">
                  {activeFilterCount}
                </Badge>
              )}
            </span>
            <ChevronDown
              className={cn(
                'size-4 transition-transform',
                (toolbarOpen || hasActiveFilters) && 'rotate-180',
              )}
            />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
          <div className="mt-2 space-y-3 rounded-xl border border-border/60 bg-card p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Numer, klient, okres..."
                className="h-11 pl-9 pr-9"
                aria-label="Wyszukaj fakturę"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                  aria-label="Wyczyść wyszukiwanie"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <div
              className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
              role="radiogroup"
              aria-label="Filtruj po statusie"
            >
              {STATUS_FILTER_OPTIONS.map((option) => {
                const active = status === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setStatus(option.value)}
                    className={cn(
                      'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>

            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-xs">
                  Wyczyść filtry
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {filteredInvoices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/60 px-4 py-10 text-center text-sm text-muted-foreground">
          Brak faktur spełniających kryteria.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {filteredInvoices.map((invoice) => {
            const client = invoice.client_id ? clientsById.get(invoice.client_id) ?? null : null
            return (
              <li key={invoice.id}>
                <InvoiceCard
                  invoice={invoice}
                  client={client}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
