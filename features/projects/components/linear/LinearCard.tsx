'use client'

import type { ReactNode } from 'react'
import { LINEAR, SURFACE } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'

type LinearCardProps = {
  eyebrow?: string
  badge?: ReactNode
  trailing?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function LinearCard({
  eyebrow,
  badge,
  trailing,
  children,
  footer,
  className,
}: LinearCardProps) {
  return (
    <section
      className={cn(SURFACE.card, className)}
    >
      {(eyebrow || badge || trailing) && (
        <header
          className={cn(
            'flex items-center justify-between border-b px-4 py-3 sm:px-5',
            LINEAR.borderInset,
          )}
        >
          <div className="flex items-center gap-2">
            {eyebrow && <p className={LINEAR.eyebrow}>{eyebrow}</p>}
            {badge}
          </div>
          {trailing}
        </header>
      )}
      <div>{children}</div>
      {footer && (
        <footer
          className={cn(
            'flex items-center justify-between border-t px-4 py-3 sm:px-5',
            LINEAR.borderInset,
          )}
        >
          {footer}
        </footer>
      )}
    </section>
  )
}
