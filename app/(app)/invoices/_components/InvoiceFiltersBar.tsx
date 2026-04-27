'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  InvoiceStatus,
  INVOICE_STATUS_LABELS_PL,
} from '@/lib/finance/invoice-status'
import {
  useInvoiceFilters,
  useInvoiceFiltersActions,
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
  const { setFilters, resetFilters } = useInvoiceFiltersActions()

  const form = useForm<InvoiceFilters>({
    defaultValues: filters,
  })

  const values = form.watch()

  useEffect(() => {
    const subscription = form.watch((nextValues) => {
      setFilters(nextValues as Partial<InvoiceFilters>)
    })

    return () => subscription.unsubscribe()
  }, [form, setFilters])

  useEffect(() => {
    const currentValues = form.getValues()
    const isDifferent =
      currentValues.status !== filters.status ||
      currentValues.searchPhrase !== filters.searchPhrase ||
      currentValues.dateRange.from !== filters.dateRange.from ||
      currentValues.dateRange.to !== filters.dateRange.to

    if (isDifferent) {
      form.reset(filters)
    }
  }, [filters, form])

  const hasActiveFilters =
    values.status !== 'all' ||
    values.searchPhrase.trim().length > 0 ||
    Boolean(values.dateRange.from || values.dateRange.to)

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
            const active = values.status === option.value
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
                form.reset()
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
