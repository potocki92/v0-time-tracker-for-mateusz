'use client'

import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { InvoiceStatus, INVOICE_STATUS_LABELS_PL } from '@/lib/finance/invoice-status'
import {
  DEFAULT_INVOICE_FILTERS,
  useInvoiceFilters,
  useResetInvoiceFilters,
  useSetInvoiceFilters,
  type InvoiceFilters,
  type InvoiceStatusFilter,
} from '@/features/invoices/hooks/useInvoiceFilters'

const STATUS_FILTER_OPTIONS: { value: InvoiceStatusFilter; label: string }[] = [
  { value: 'all', label: 'Wszystkie' },
  { value: InvoiceStatus.DRAFT, label: INVOICE_STATUS_LABELS_PL.DRAFT },
  { value: InvoiceStatus.SENT, label: INVOICE_STATUS_LABELS_PL.SENT },
  { value: InvoiceStatus.PAID, label: INVOICE_STATUS_LABELS_PL.PAID },
  { value: InvoiceStatus.OVERDUE, label: INVOICE_STATUS_LABELS_PL.OVERDUE },
  { value: InvoiceStatus.CANCELLED, label: INVOICE_STATUS_LABELS_PL.CANCELLED },
]

export function InvoiceFiltersBar() {
  const filters = useInvoiceFilters()
  const setFilters = useSetInvoiceFilters()
  const resetFilters = useResetInvoiceFilters()

  const form = useForm<InvoiceFilters>({
    defaultValues: filters,
  })

  const status = useWatch({ control: form.control, name: 'status', defaultValue: filters.status })
  const searchPhrase = useWatch({
    control: form.control,
    name: 'searchPhrase',
    defaultValue: filters.searchPhrase,
  })
  const dateFrom = useWatch({
    control: form.control,
    name: 'dateRange.from',
    defaultValue: filters.dateRange.from,
  })
  const dateTo = useWatch({
    control: form.control,
    name: 'dateRange.to',
    defaultValue: filters.dateRange.to,
  })

  useEffect(() => {
    const subscription = form.watch((nextValues) => {
      setFilters({
        status: nextValues.status ?? DEFAULT_INVOICE_FILTERS.status,
        searchPhrase: nextValues.searchPhrase ?? '',
        dateRange: {
          from: nextValues.dateRange?.from ?? null,
          to: nextValues.dateRange?.to ?? null,
        },
      })
    })

    return () => subscription.unsubscribe()
  }, [form, setFilters])

  useEffect(() => {
    const currentValues = form.getValues()
    const isDifferent =
      currentValues.status !== filters.status ||
      currentValues.searchPhrase !== filters.searchPhrase ||
      currentValues.dateRange?.from !== filters.dateRange.from ||
      currentValues.dateRange?.to !== filters.dateRange.to

    if (isDifferent) {
      form.reset(filters)
    }
  }, [filters, form])

  const hasActiveFilters = useMemo(
    () => status !== 'all' || (searchPhrase ?? '').trim().length > 0 || Boolean(dateFrom || dateTo),
    [dateFrom, dateTo, searchPhrase, status],
  )

  return (
    <Form {...form}>
      <form className="space-y-3 rounded-xl border border-border/60 bg-card p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <FormField
            control={form.control}
            name="searchPhrase"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Szukaj po numerze, nazwie, odbiorcy..."
                      className="h-11 pl-9 pr-9"
                    />
                    {field.value && (
                      <button
                        type="button"
                        onClick={() => field.onChange('')}
                        className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                        aria-label="Wyczyść wyszukiwanie"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateRange.from"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="date" className="h-11" {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateRange.to"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="date" className="h-11" {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTER_OPTIONS.map((option) => {
            const active = status === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => form.setValue('status', option.value, { shouldDirty: true })}
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

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto h-8 text-xs"
              onClick={() => {
                resetFilters()
                form.reset(DEFAULT_INVOICE_FILTERS)
              }}
            >
              Wyczyść filtry
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
