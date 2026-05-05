'use client'

import * as React from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SubmitButton, UniversalForm } from '@/components/common/form'
import type { InvoiceBuilderValues } from '@/lib/schemas/invoice-builder.schema'
import type { Client } from '@/lib/types'

import {
  ClientPickerField,
  InvoiceBuilderFields,
  useInvoiceBuilderForm,
  type InvoiceBuilderDefaults,
} from './form'

interface InvoiceBuilderDialogProps {
  open:           boolean
  isSaving:       boolean
  /** Pre-populated values for edit mode. Omit for "new invoice". */
  initialValues?: InvoiceBuilderValues
  /** Defaults applied when creating a new invoice (number, due days, …). */
  defaults?:      InvoiceBuilderDefaults
  clients:        Client[]
  selectedClientId: string | null
  onSelectedClientIdChange: (clientId: string | null) => void
  onClose:        () => void
  onSubmit:       (values: InvoiceBuilderValues) => void | Promise<void>
}

/**
 * Mobile-first dialog for the redesigned Invoice Builder.
 *
 * Visually identical to `<ClientFormDialog>` so the two flows feel like the
 * same application:
 *  - Mobile: 100dvh sheet, no rounding, body scrolls between sticky header
 *    and footer (so the primary action stays reachable above the keyboard).
 *  - Desktop: centred 3xl modal with rounded corners and 90vh max-height.
 *
 * Form state is owned by `<UniversalForm>` (RHF + Zod). The dialog itself
 * holds zero invoice state — it's a pure container.
 */
export function InvoiceBuilderDialog({
  open,
  isSaving,
  initialValues,
  defaults,
  clients,
  selectedClientId,
  onSelectedClientIdChange,
  onClose,
  onSubmit,
}: InvoiceBuilderDialogProps) {
  const { defaultValues, resolver, isEditMode, title } = useInvoiceBuilderForm({
    initialValues,
    defaults,
  })

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent
        className={[
          // Mobile: full-screen sheet.
          'inset-0 flex h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0',
          // Desktop: centred modal — wider than the client form because the
          // line items grid needs the extra horizontal real estate.
          'sm:inset-auto sm:top-[50%] sm:left-[50%] sm:h-auto sm:max-h-[90vh] sm:w-[calc(100%-2rem)] sm:max-w-3xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl sm:border',
        ].join(' ')}
      >
        <DialogHeader className="sticky top-0 z-10 border-b bg-background/95 px-5 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Formularz {isEditMode ? 'edycji' : 'wystawiania'} faktury z metadanymi,
            danymi nabywcy, pozycjami, podsumowaniem oraz informacjami o płatności.
          </DialogDescription>
        </DialogHeader>

        <UniversalForm
          id="invoice-builder-form"
          ariaLabel={isEditMode ? 'Formularz edycji faktury' : 'Formularz nowej faktury'}
          resolver={resolver}
          defaultValues={defaultValues}
          resetOnDefaultValuesChange
          onSubmit={(values) => onSubmit(values)}
          className="flex min-h-0 flex-1 flex-col gap-0 space-y-0"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="mb-5">
              <ClientPickerField
                clients={clients}
                selectedClientId={selectedClientId}
                onSelectedClientIdChange={onSelectedClientIdChange}
              />
            </div>
            <InvoiceBuilderFields isEditMode={isEditMode} clientId={selectedClientId} />
          </div>

          <footer className="sticky bottom-0 z-10 flex flex-col-reverse gap-2 border-t bg-background/95 px-5 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="h-12 sm:h-10"
            >
              Anuluj
            </Button>
            <SubmitButton
              pendingLabel="Zapisywanie..."
              className="mt-0 sm:h-10 sm:w-auto sm:px-6"
            >
              {isEditMode ? 'Zapisz zmiany' : 'Wystaw fakturę'}
            </SubmitButton>
          </footer>
        </UniversalForm>
      </DialogContent>
    </Dialog>
  )
}
