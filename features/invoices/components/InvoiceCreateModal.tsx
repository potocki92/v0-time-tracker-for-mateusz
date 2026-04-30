import { Dialog } from "@/components/ui/dialog"
import { useCloseModal, useModalState } from "@/hooks/stores/useUiStore"

export function InvoiceCreateModal() {
  const { open, payload } = useModalState('invoice-create')
  const close = useCloseModal()
  if (!open) return null
  return <Dialog open onOpenChange={() => close('invoice-create')}>...</Dialog>
}