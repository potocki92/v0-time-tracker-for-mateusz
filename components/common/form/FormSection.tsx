'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

interface FormSectionProps {
  title:        string
  description?: string
  /** Optional slot for an action/toggle aligned with the section header. */
  action?:      React.ReactNode
  children:     React.ReactNode
  className?:   string
  /** Render the body without the default vertical rhythm — useful when the
   *  section embeds its own grid/table that needs full control over spacing. */
  bodyClassName?: string
}

/**
 * Semantic grouping block for form fields.
 *
 * Rendered as a native <section> with an <h3> heading associated to the group
 * via aria-labelledby. On mobile we rely on typography + spacing alone (no
 * heavy borders) so the form doesn't feel cramped; on desktop a subtle surface
 * makes groups scan faster. Lifted from the clients form so any feature can
 * adopt the same visual rhythm without duplicating the chrome.
 */
export function FormSection({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: FormSectionProps) {
  const headingId = React.useId()
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        'space-y-4 rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-5',
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <h3
            id={headingId}
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            {title}
          </h3>
          {description ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>

      <div className={cn('space-y-4', bodyClassName)}>{children}</div>
    </section>
  )
}
