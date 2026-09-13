'use client'

import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import type { WorkspaceLayer } from '@/components/ui/tokens'
import {
  WorkspaceOverlay,
  WorkspaceOverlayBody,
  WorkspaceOverlayFooter,
} from './workspace-overlay'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** Konsekwencje operacji — węzeł, bo nazwa encji bywa wyróżniona. */
  children: ReactNode
  confirmLabel: string
  /** Etykieta przycisku w trakcie operacji; bez niej zostaje `confirmLabel`. */
  pendingLabel?: string
  isPending?: boolean
  onConfirm: () => void
  layer?: WorkspaceLayer
}

/**
 * Potwierdzenie operacji nieodwracalnej — kompaktowy wariant
 * `WorkspaceOverlay`, nie osobny system.
 *
 * Cztery sekcje miały wcześniej cztery kopie tego samego dialogu (klient,
 * projekt, faktura, wyjazd), każda z własną szerokością i własnym układem
 * stopki. Kolor destructive zostaje kolorem znaczącym — wyszarzenie go
 * skasowałoby jedyny sygnał, że akcja nie ma odwrotu.
 */
export function WorkspaceConfirmOverlay({
  open,
  onOpenChange,
  title,
  children,
  confirmLabel,
  pendingLabel,
  isPending = false,
  onConfirm,
  layer,
}: Props) {
  const t = useTranslations('common')

  return (
    <WorkspaceOverlay
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="sm"
      layer={layer}
    >
      <WorkspaceOverlayBody className="flex gap-3 text-sm text-zinc-300">
        <AlertCircle aria-hidden className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div className="min-w-0">{children}</div>
      </WorkspaceOverlayBody>
      <WorkspaceOverlayFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
          className="h-11 sm:h-9"
        >
          {t('actions.cancel')}
        </Button>
        <Button
          variant="destructive"
          onClick={onConfirm}
          disabled={isPending}
          className="h-11 sm:h-9"
        >
          {isPending ? (pendingLabel ?? confirmLabel) : confirmLabel}
        </Button>
      </WorkspaceOverlayFooter>
    </WorkspaceOverlay>
  )
}
