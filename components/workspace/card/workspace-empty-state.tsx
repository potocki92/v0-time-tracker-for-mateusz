'use client'

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { SURFACE } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'

type Props = {
  icon: LucideIcon
  title: string
  description: string
  /** Akcja wyprowadzająca z pustego stanu — „dodaj pierwszego", „wyczyść filtry". */
  action?: ReactNode
  className?: string
}

/**
 * Pusty stan sekcji. Część designu, nie przypadkowy `<p>`: ta sama przerywana
 * powierzchnia co reszta pustych miejsc w panelu.
 *
 * Zastępuje `ReportEmptyState` i `StatementEmptyState` — różniły się wyłącznie
 * szerokością opisu (`max-w-xs` vs `max-w-sm`).
 */
export function WorkspaceEmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        SURFACE.cardDashed,
        'flex flex-col items-center justify-center gap-2 px-4 py-10 text-center',
        className,
      )}
    >
      <Icon aria-hidden className="size-6 text-zinc-400" />
      <p className="text-sm font-medium text-zinc-200">{title}</p>
      <p className="max-w-sm text-xs text-zinc-400">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
