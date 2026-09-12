'use client'

import type { LucideIcon } from 'lucide-react'
import { SURFACE } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'

type Props = {
  icon: LucideIcon
  title: string
  description: string
  className?: string
}

/** Pusty stan wykazu — ta sama przerywana powierzchnia co reszta panelu. */
export function StatementEmptyState({ icon: Icon, title, description, className }: Props) {
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
    </div>
  )
}
