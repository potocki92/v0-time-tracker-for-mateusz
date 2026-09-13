'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import { SubmitButton, UniversalForm } from '@/components/common/form'
import {
  WorkspaceOverlay,
  WorkspaceOverlayBody,
  WorkspaceOverlayFooter,
} from '@/components/workspace'
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
 * Builder faktury.
 *
 * Najszerszy ekran panelu (`size="xl"`) — siatka pozycji potrzebuje miejsca
 * w poziomie. Poza szerokością nie różni się niczym od formularza klienta czy
 * projektu: ten sam `WorkspaceOverlay`, ten sam nagłówek, ta sama stopka.
 *
 * Stan formularza należy do `<UniversalForm>` (RHF + Zod); overlay nie trzyma
 * żadnego stanu faktury.
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
    <WorkspaceOverlay
      open={open}
      onOpenChange={(value) => !value && onClose()}
      title={title}
      srDescription={`Formularz ${isEditMode ? 'edycji' : 'wystawiania'} faktury z metadanymi, danymi nabywcy, pozycjami, podsumowaniem oraz informacjami o płatności.`}
      size="xl"
    >
      <UniversalForm
        id="invoice-builder-form"
        ariaLabel={isEditMode ? 'Formularz edycji faktury' : 'Formularz nowej faktury'}
        resolver={resolver}
        defaultValues={defaultValues}
        onSubmit={(values) => onSubmit(values)}
        className="flex min-h-0 flex-1 flex-col gap-0 space-y-0"
      >
        <WorkspaceOverlayBody>
          <div className="mb-5">
            <ClientPickerField
              clients={clients}
              selectedClientId={selectedClientId}
              onSelectedClientIdChange={onSelectedClientIdChange}
            />
          </div>
          <InvoiceBuilderFields isEditMode={isEditMode} clientId={selectedClientId} />
        </WorkspaceOverlayBody>

        <WorkspaceOverlayFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="h-11 sm:h-9"
          >
            Anuluj
          </Button>
          <SubmitButton
            pendingLabel="Zapisywanie..."
            className="mt-0 h-11 w-full rounded-xl bg-brand-500 text-brand-foreground shadow-none hover:bg-brand-400 hover:shadow-none sm:h-9 sm:w-auto sm:px-6"
          >
            {isEditMode ? 'Zapisz zmiany' : 'Wystaw fakturę'}
          </SubmitButton>
        </WorkspaceOverlayFooter>
      </UniversalForm>
    </WorkspaceOverlay>
  )
}
