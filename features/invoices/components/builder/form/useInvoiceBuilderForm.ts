'use client'

import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  invoiceBuilderSchema,
  type InvoiceBuilderValues,
} from '@/lib/schemas/invoice-builder.schema'

import {
  createDefaultInvoiceBuilderValues,
  type InvoiceBuilderDefaults,
} from './invoice-builder.helpers'

/**
 * Wires the Zod schema, default-value factory and a stable resolver into a
 * single hook the dialog can plug into `<UniversalForm>`. Mirrors the shape
 * of `useClientFormDialog` so contributors can context-switch between the
 * two forms without re-learning conventions.
 */
export function useInvoiceBuilderForm(options: {
  initialValues?: InvoiceBuilderValues
  defaults?:      InvoiceBuilderDefaults
}) {
  const { initialValues, defaults } = options

  const defaultValues = useMemo<InvoiceBuilderValues>(() => {
    return initialValues ?? createDefaultInvoiceBuilderValues(defaults)
    // We deliberately depend on the identity of `initialValues` /
    // `defaults`. Callers should memoize them (or pass stable references)
    // to avoid an infinite reset loop with `resetOnDefaultValuesChange`.
  }, [initialValues, defaults])

  const resolver = useMemo(() => zodResolver(invoiceBuilderSchema), [])

  const isEditMode = Boolean(initialValues)
  const title = isEditMode ? 'Edytuj fakturę' : 'Nowa faktura'

  return {
    defaultValues,
    resolver,
    isEditMode,
    title,
  }
}
