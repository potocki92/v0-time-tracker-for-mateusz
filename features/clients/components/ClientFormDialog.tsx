'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SubmitButton, UniversalForm } from '@/components/common/form'
import type { Client, ClientFormData } from '@/lib/types'

import { ClientFormFields } from './form/ClientFormFields'
import { useClientFormDialog } from './form/useClientFormDialog'

type Props = {
  open:     boolean
  client:   Client | null
  isSaving: boolean
  onClose:  () => void
  onSubmit: (form: ClientFormData) => void
}

/**
 * Mobile-first dialog for creating / editing a client.
 *
 * - On small viewports the dialog stretches to fill the screen (100dvh, no
 *   rounding) so the user gets a native-feeling full-screen form without
 *   horizontal scrolling.
 * - On `sm:` and up it collapses to a centred modal with a generous width.
 * - The body scrolls independently of the header and footer. The footer is
 *   sticky so the primary action is always reachable regardless of keyboard
 *   height or form length.
 */
export function ClientFormDialog({
  open,
  client,
  isSaving,
  onClose,
  onSubmit,
}: Props) {
  const { defaultValues, resolver, handleSubmit, isEditMode, title } =
    useClientFormDialog(client)

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent
        className={[
          // Mobile: full-screen sheet.
          'inset-0 flex h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0',
          // Desktop: centred modal.
          'sm:inset-auto sm:top-[50%] sm:left-[50%] sm:h-auto sm:max-h-[90vh] sm:w-[calc(100%-2rem)] sm:max-w-2xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl sm:border',
        ].join(' ')}
      >
        <DialogHeader className="sticky top-0 z-10 border-b bg-background/95 px-5 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Formularz {isEditMode ? 'edycji' : 'dodawania'} klienta z danymi
            podstawowymi, kontaktowymi, adresowymi i rozliczeniowymi.
          </DialogDescription>
        </DialogHeader>

        <UniversalForm
          id="client-form"
          ariaLabel={isEditMode ? 'Formularz edycji klienta' : 'Formularz nowego klienta'}
          resolver={resolver}
          defaultValues={defaultValues}
          resetOnDefaultValuesChange
          onSubmit={(values) => handleSubmit(values, onSubmit)}
          className="flex min-h-0 flex-1 flex-col gap-0 space-y-0"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            <ClientFormFields isEditMode={isEditMode} />
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
              {isEditMode ? 'Zapisz zmiany' : 'Dodaj klienta'}
            </SubmitButton>
          </footer>
        </UniversalForm>
      </DialogContent>
    </Dialog>
  )
}
