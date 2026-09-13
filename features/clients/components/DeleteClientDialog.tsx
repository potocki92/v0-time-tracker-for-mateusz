'use client'

import { WorkspaceConfirmOverlay } from '@/components/workspace'
import type { Client } from '@/lib/types'

type Props = {
  client:    Client | null
  isPending: boolean
  onConfirm: () => void
  onClose:   () => void
}

export function DeleteClientDialog({ client, isPending, onConfirm, onClose }: Props) {
  return (
    <WorkspaceConfirmOverlay
      open={Boolean(client)}
      onOpenChange={(open) => !open && onClose()}
      title="Usunąć klienta?"
      confirmLabel="Usuń"
      pendingLabel="Usuwanie..."
      isPending={isPending}
      onConfirm={onConfirm}
    >
      <span className="font-medium text-white">{client?.name}</span> zostanie trwale usunięty.
      Powiązane projekty zostają odłączone, a wpisy pracy zachowają zapisane stawki historyczne.
    </WorkspaceConfirmOverlay>
  )
}
