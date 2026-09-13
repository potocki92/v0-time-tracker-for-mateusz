'use client'

import { Button } from '@/components/ui/button'
import { SubmitButton, UniversalForm } from '@/components/common/form'
import {
  WorkspaceOverlay,
  WorkspaceOverlayBody,
  WorkspaceOverlayFooter,
} from '@/components/workspace'
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
 * Formularz klienta.
 *
 * Wcześniej rozciągał `DialogContent` do pełnego ekranu na telefonie własnym
 * zestawem klas (`inset-0 h-[100dvh] rounded-none`) i wracał do dialogu od
 * `sm:`. To samo robi teraz `WorkspaceOverlay` — raz, dla wszystkich sekcji.
 *
 * `SubmitButton` przychodzi ze wspólnej warstwy formularzy, której używa też
 * strefa publiczna (jasny motyw), więc geometrię i kolor akcji dopina tu
 * `className` — zamiast przemalowywać komponent dla wszystkich.
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
    <WorkspaceOverlay
      open={open}
      onOpenChange={(value) => !value && onClose()}
      title={title}
      srDescription={`Formularz ${isEditMode ? 'edycji' : 'dodawania'} klienta z danymi podstawowymi, kontaktowymi, adresowymi i rozliczeniowymi.`}
      size="lg"
    >
      <UniversalForm
        id="client-form"
        ariaLabel={isEditMode ? 'Formularz edycji klienta' : 'Formularz nowego klienta'}
        resolver={resolver}
        defaultValues={defaultValues}
        resetOnDefaultValuesChange
        onSubmit={(values) => handleSubmit(values, onSubmit)}
        className="flex min-h-0 flex-1 flex-col gap-0 space-y-0"
      >
        <WorkspaceOverlayBody>
          <ClientFormFields isEditMode={isEditMode} />
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
            {isEditMode ? 'Zapisz zmiany' : 'Dodaj klienta'}
          </SubmitButton>
        </WorkspaceOverlayFooter>
      </UniversalForm>
    </WorkspaceOverlay>
  )
}
