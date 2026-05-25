import { AlertCircle } from 'lucide-react'
import type { Invoice } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { DIALOG_DARK_SURFACE } from '../dialog-theme'

interface DeleteInvoiceDialogProps {
  invoice: Invoice | null
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteInvoiceDialog({ invoice, isDeleting, onClose, onConfirm }: DeleteInvoiceDialogProps) {
  return (
    <Dialog open={!!invoice} onOpenChange={onClose}>
      <DialogContent className={cn(DIALOG_DARK_SURFACE, 'sm:max-w-md')}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Usunąć fakturę?
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Ta operacja jest nieodwracalna. Faktura <span className="font-medium text-foreground">{invoice?.name}</span> zostanie usunięta.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Anuluj</Button>
          <Button variant="destructive" disabled={isDeleting} onClick={onConfirm}>
            {isDeleting ? 'Usuwanie...' : 'Usuń'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
