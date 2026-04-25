/**
 * Public surface of the redesigned Invoice Builder.
 *
 * Consumers should only need to import the dialog and the helpers used to
 * shape its initial values. Everything else (sections, line item row,
 * shared fields) is an implementation detail.
 */

export { InvoiceBuilderDialog } from './InvoiceBuilderDialog'

export {
  createDefaultInvoiceBuilderValues,
  emptyLineItem,
  isForeignCurrency,
  isInvoiceBuilderCurrency,
  makeLineItemId,
  todayIso,
  addDaysIso,
  type InvoiceBuilderDefaults,
} from './invoice-builder.helpers'
