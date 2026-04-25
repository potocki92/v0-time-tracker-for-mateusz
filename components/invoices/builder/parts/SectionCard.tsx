import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionCardProps {
  title: string
  description?: string
  /** Visual anchor rendered in the top-right — usually a status or a button. */
  trailing?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Thin presentational wrapper that gives every section (Metadata, Counterparty,
 * Items, …) a consistent header + spacing. Built on plain divs on purpose so it
 * works both inside a Dialog and on a standalone page.
 */
export function SectionCard({ title, description, trailing, children, className }: SectionCardProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow-sm',
        'p-4 sm:p-6 space-y-4',
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold sm:text-lg">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </header>
      {children}
    </section>
  )
}
