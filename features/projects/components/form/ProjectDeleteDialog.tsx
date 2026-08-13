'use client'

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Project } from '@/lib/types'

type Props = {
  project: Project | null
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ProjectDeleteDialog({ project, isDeleting, onCancel, onConfirm }: Props) {
  return (
    <Dialog open={!!project} onOpenChange={(open) => !open && onCancel()}>
      {/* Potwierdzenie wychodzi z panelu szczegółów, więc musi stanąć nad
          Sheetem (z-50) razem z własnym, przyciemnionym overlayem. */}
      <DialogContent
        className="z-[60] sm:max-w-md"
        overlayClassName="z-[60] bg-black/60 backdrop-blur-sm"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Usunąć projekt?
          </DialogTitle>
          <DialogDescription>
            Ta operacja jest nieodwracalna. Projekt{' '}
            <span className="font-medium text-foreground">{project?.name}</span> zostanie usunięty.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
            Anuluj
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Usuwanie...' : 'Usuń projekt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
