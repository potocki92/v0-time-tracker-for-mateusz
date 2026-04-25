'use client'

import { FormProvider } from 'react-hook-form'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useInvoiceBuilderForm, type UseInvoiceBuilderFormOptions } from './useInvoiceBuilderForm'
import { MetadataSection } from './sections/MetadataSection'
import { CounterpartySection } from './sections/CounterpartySection'
import { LineItemsSection } from './sections/LineItemsSection'
import { SummarySection } from './sections/SummarySection'
import { PaymentSection } from './sections/PaymentSection'

interface InvoiceBuilderProps extends UseInvoiceBuilderFormOptions {
  /** Title rendered above the form. */
  title?: string
  /** Label of the primary CTA. */
  submitLabel?: string
  isSubmitting?: boolean
  onCancel?: () => void
}

/**
 * The redesigned Invoice Builder. A single, scrollable, mobile-first page that
 * groups the form into five clearly-labeled sections (Metadata, Counterparty,
 * Items, Summary, Payment) and shows live totals as the user types.
 *
 * Architectural notes:
 *   - All money math is delegated to `lib/finance/invoice-builder-engine`.
 *     The view never multiplies floats.
 *   - State lives in react-hook-form via `useInvoiceBuilderForm`. Sections read
 *     from the same FormProvider so we never prop-drill values down the tree.
 *   - Layout is pure CSS — `useIsMobile` is only used to swap the line-items
 *     between card and grid; everything else uses Tailwind responsive utilities.
 */
export function InvoiceBuilder(props: InvoiceBuilderProps) {
  const builder = useInvoiceBuilderForm({
    defaultValues: props.defaultValues,
    onSubmit: props.onSubmit,
  })

  const isSubmitting = props.isSubmitting || builder.form.formState.isSubmitting

  return (
    <FormProvider {...builder.form}>
      <form
        onSubmit={builder.submit}
        noValidate
        className="mx-auto w-full max-w-5xl space-y-4 pb-32 sm:space-y-6 sm:pb-8"
        aria-label={props.title ?? 'Formularz faktury'}
      >
        {props.title ? (
          <div className="px-1">
            <h1 className="text-xl font-semibold sm:text-2xl">{props.title}</h1>
          </div>
        ) : null}

        <MetadataSection />
        <CounterpartySection />
        <LineItemsSection builder={builder} />
        <SummarySection totals={builder.totals} />
        <PaymentSection />

        {/* Sticky footer on mobile keeps the primary action one tap away.
            On desktop it falls back into the document flow. */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 p-3 backdrop-blur sm:static sm:flex sm:justify-end sm:gap-2 sm:rounded-xl sm:border sm:bg-card sm:p-4">
          <div className="mx-auto flex max-w-5xl gap-2 sm:mx-0">
            {props.onCancel ? (
              <Button type="button" variant="outline" onClick={props.onCancel} className="flex-1 sm:flex-none">
                Anuluj
              </Button>
            ) : null}
            <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Save className="mr-2 h-4 w-4" aria-hidden />
              )}
              {isSubmitting ? 'Zapisywanie…' : props.submitLabel ?? 'Zapisz fakturę'}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}
