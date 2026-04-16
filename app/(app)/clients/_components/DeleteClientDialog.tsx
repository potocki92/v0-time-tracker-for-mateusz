'use client'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Client } from '@/lib/types'

type Props = {
  client:    Client | null
  isPending: boolean
  onConfirm: () => void
  onClose:   () => void
}

export function DeleteClientDialog({ client, isPending, onConfirm, onClose }: Props) {
  return (
    <Dialog open={Boolean(client)} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Usunąć klienta?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {client
            ? `"${client.name}" zostanie trwale usunięty. Powiązane projekty zostają odłączone, a wpisy pracy zachowają zapisane stawki historyczne.`
            : ''}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Anuluj
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Usuwanie...' : 'Usuń'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
