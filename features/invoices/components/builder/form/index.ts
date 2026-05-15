/**
 * Form layer for the Invoice Builder.
 *
 * Everything that wires React Hook Form + Zod into the builder lives here:
 *
 *  - Field-level primitives        (`shared-fields.tsx`)
 *  - Section composer              (`InvoiceBuilderFields.tsx`)
 *  - Sortable line items array     (`InvoiceLineItemsField.tsx` + row)
 *  - Read-only totals panel        (`InvoiceTotalsSummary.tsx`)
 *  - Default-value / resolver hook (`useInvoiceBuilderForm.ts`)
 *  - Pure helpers (no React)       (`invoice-builder.helpers.ts`)
 *
 * The dialog (`../InvoiceBuilderDialog.tsx`) consumes this surface and stays
 * a pure container — it owns no invoice state of its own.
 */

export { ClientPickerField } from './ClientPickerField'
export { InvoiceBuilderFields } from './InvoiceBuilderFields'
export { InvoiceLineItemsField } from './InvoiceLineItemsField'
export { InvoiceLineItemRow } from './InvoiceLineItemRow'
export { InvoiceTotalsSummary } from './InvoiceTotalsSummary'

export {
  EnumSelectField,
  NumericFormInput,
  type EnumOption,
} from './shared-fields'

export { useInvoiceBuilderForm } from './useInvoiceBuilderForm'

export {
  addDaysIso,
  createDefaultInvoiceBuilderValues,
  emptyLineItem,
  inferCountryCodeFromTaxId,
  isForeignCurrency,
  isInvoiceBuilderCurrency,
  makeLineItemId,
  resolveBuyerCountryCode,
  todayIso,
  type InvoiceBuilderDefaults,
} from './invoice-builder.helpers'

export {
  builderValuesToFormValues,
  invoiceToBuilderValues,
} from './invoice-builder.adapters'
