'use client'

import { useCallback, useMemo } from 'react'
import { useForm, useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  invoiceBuilderSchema,
  type InvoiceBuilderValues,
  type LineItemInput,
} from '@/lib/schemas/invoice-builder.schema'
import {
  computeInvoiceTotals,
  computeLineTotals,
  type InvoiceTotals,
  type LineTotals,
} from '@/lib/finance/invoice-builder-engine'

export interface UseInvoiceBuilderFormOptions {
  defaultValues?: Partial<InvoiceBuilderValues>
  onSubmit: (values: InvoiceBuilderValues) => void | Promise<void>
}

/**
 * Ids are local-only (dnd-kit keys, React keys). Crypto.randomUUID is available
 * in all modern runtimes we target; we fall back to a Math.random seed so the
 * hook stays usable in SSR snapshots and older jsdom test envs.
 */
function newLineId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `line_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`
}

export function emptyLineItem(): LineItemInput {
  return {
    id: newLineId(),
    description: '',
    unit: 'szt.',
    quantity: 1,
    unit_price_net: 0,
    vat_mode: 'standard',
    vat_rate: 23,
  }
}

function today(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + days)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export function buildDefaultValues(
  overrides?: Partial<InvoiceBuilderValues>,
): InvoiceBuilderValues {
  const issue = overrides?.issue_date ?? today()
  return {
    invoice_number: '',
    issue_date: issue,
    sale_date: issue,
    due_date: addDays(issue, 14),
    currency: 'PLN',
    language: 'pl',
    buyer: {
      name: '',
      tax_id: '',
      country_code: 'PL',
      address: '',
      city: '',
      postal_code: '',
      email: '',
      is_vat_eu: false,
    },
    items: [emptyLineItem()],
    payment: {
      method: 'bank_transfer',
      bank_account: '',
      bank_name: '',
      swift: '',
    },
    notes: '',
    ...overrides,
  }
}

export interface InvoiceBuilderForm {
  form: UseFormReturn<InvoiceBuilderValues>
  items: ReturnType<typeof useFieldArray<InvoiceBuilderValues, 'items'>>
  /** Live totals — recomputed on every relevant value change (pure, cheap). */
  totals: InvoiceTotals
  /** Live per-line totals keyed by line.id for fast lookup in the items list. */
  lineTotals: Record<string, LineTotals>
  addLine: () => void
  removeLine: (index: number) => void
  moveLine: (from: number, to: number) => void
  duplicateLine: (index: number) => void
  submit: ReturnType<UseFormReturn<InvoiceBuilderValues>['handleSubmit']>
}

export function useInvoiceBuilderForm(options: UseInvoiceBuilderFormOptions): InvoiceBuilderForm {
  const form = useForm<InvoiceBuilderValues>({
    resolver: zodResolver(invoiceBuilderSchema),
    defaultValues: buildDefaultValues(options.defaultValues),
    mode: 'onBlur',
  })

  const items = useFieldArray({
    control: form.control,
    name: 'items',
    keyName: '_rhfId',
  })

  // Watch only the slices that drive the totals — avoids re-renders when the
  // user types in the notes field, for example.
  const watchedCurrency = useWatch({ control: form.control, name: 'currency' })
  const watchedRate = useWatch({ control: form.control, name: 'exchange_rate' })
  const watchedItems = useWatch({ control: form.control, name: 'items' }) as LineItemInput[] | undefined

  const totals = useMemo<InvoiceTotals>(
    () =>
      computeInvoiceTotals({
        currency: watchedCurrency,
        exchange_rate: watchedRate,
        items: watchedItems ?? [],
      }),
    [watchedCurrency, watchedRate, watchedItems],
  )

  const lineTotals = useMemo<Record<string, LineTotals>>(() => {
    const out: Record<string, LineTotals> = {}
    for (const item of watchedItems ?? []) {
      if (!item?.id) continue
      out[item.id] = computeLineTotals(item, watchedCurrency)
    }
    return out
  }, [watchedItems, watchedCurrency])

  const addLine = useCallback(() => {
    items.append(emptyLineItem())
  }, [items])

  const removeLine = useCallback(
    (index: number) => {
      if (items.fields.length <= 1) {
        // Always keep at least one editable line — replace instead of remove.
        items.update(0, emptyLineItem())
        return
      }
      items.remove(index)
    },
    [items],
  )

  const moveLine = useCallback(
    (from: number, to: number) => {
      if (from === to) return
      items.move(from, to)
    },
    [items],
  )

  const duplicateLine = useCallback(
    (index: number) => {
      const source = form.getValues(`items.${index}`)
      if (!source) return
      items.insert(index + 1, { ...source, id: newLineId() })
    },
    [items, form],
  )

  const submit = form.handleSubmit(options.onSubmit)

  return {
    form,
    items,
    totals,
    lineTotals,
    addLine,
    removeLine,
    moveLine,
    duplicateLine,
    submit,
  }
}
