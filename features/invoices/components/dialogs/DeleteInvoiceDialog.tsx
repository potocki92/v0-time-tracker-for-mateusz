import type { Invoice } from '@/lib/types'
import { WorkspaceConfirmOverlay } from '@/components/workspace'

interface DeleteInvoiceDialogProps {
  invoice: Invoice | null
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteInvoiceDialog({ invoice, isDeleting, onClose, onConfirm }: DeleteInvoiceDialogProps) {
  return (
    <WorkspaceConfirmOverlay
      open={!!invoice}
      onOpenChange={(open) => !open && onClose()}
      title="Usunąć fakturę?"
      confirmLabel="Usuń"
      pendingLabel="Usuwanie..."
      isPending={isDeleting}
      onConfirm={onConfirm}
    >
      Ta operacja jest nieodwracalna. Faktura{' '}
      <span className="font-medium text-white">{invoice?.name}</span> zostanie usunięta.
    </WorkspaceConfirmOverlay>
  )
}
