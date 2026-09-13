'use client'

import { WorkspaceConfirmOverlay } from '@/components/workspace'
import type { Project } from '@/lib/types'

type Props = {
  project: Project | null
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

/**
 * Potwierdzenie wychodzi z panelu szczegółów projektu, więc stoi na warstwie
 * `stacked` — nad panelem i nad formularzem edycji.
 */
export function ProjectDeleteDialog({ project, isDeleting, onCancel, onConfirm }: Props) {
  return (
    <WorkspaceConfirmOverlay
      open={!!project}
      onOpenChange={(open) => !open && onCancel()}
      title="Usunąć projekt?"
      confirmLabel="Usuń projekt"
      pendingLabel="Usuwanie..."
      isPending={isDeleting}
      onConfirm={onConfirm}
      layer="stacked"
    >
      Ta operacja jest nieodwracalna. Projekt{' '}
      <span className="font-medium text-white">{project?.name}</span> zostanie usunięty.
    </WorkspaceConfirmOverlay>
  )
}
