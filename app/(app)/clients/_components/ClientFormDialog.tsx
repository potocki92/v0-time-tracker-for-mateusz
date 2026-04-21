'use client'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SubmitButton, UniversalForm } from '@/components/common/form'
import type { Client, ClientFormData } from '@/lib/types'
import { ClientFormFields } from './form/ClientFormFields'
import { useClientFormDialog } from './form/useClientFormDialog'

type Props = {
  open:          boolean
  client:        Client | null
  isSaving:      boolean
  onClose:       () => void
  onSubmit:      (form: ClientFormData) => void
}

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
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <UniversalForm
          id="client-form"
          ariaLabel="Formularz klienta"
          resolver={resolver}
          defaultValues={defaultValues}
          resetOnDefaultValuesChange
          onSubmit={(values) => handleSubmit(values, onSubmit)}
        >
          <ClientFormFields isEditMode={isEditMode} />

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSaving} type="button">
              Anuluj
            </Button>
            <SubmitButton pendingLabel="Zapisywanie...">
              Zapisz
            </SubmitButton>
          </DialogFooter>
        </UniversalForm>
      </DialogContent>
    </Dialog>
  )
}
