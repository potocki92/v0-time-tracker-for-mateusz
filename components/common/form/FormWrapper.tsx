'use client'

import * as React from 'react'
import { m } from 'framer-motion'

import { cn } from '@/lib/utils'

interface FormWrapperProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?:        React.ReactNode
  description?:  React.ReactNode
  footer?:       React.ReactNode
  /** Small content rendered below the description (e.g. announcement, badge). */
  headerExtra?:  React.ReactNode
  /** Forces the old card treatment (border + shadow). Default: false — caller owns the surface. */
  boxed?:        boolean
}

/**
 * Presentational wrapper for form content.
 *
 * By default the wrapper is transparent — it just provides an animated
 * title / description / footer frame. The surface (card, border, padding)
 * lives in the page layout (e.g. `AuthShell`). Pass `boxed` to get the
 * old standalone card treatment.
 */
export const FormWrapper = React.forwardRef<HTMLDivElement, FormWrapperProps>(
  function FormWrapper(
    { title, description, footer, headerExtra, boxed, className, children, ...rest },
    ref,
  ) {
    return (
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={cn('w-full', className)}
      >
        <div
          ref={ref}
          className={cn(
            boxed &&
              'rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8',
          )}
          {...rest}
        >
          {title || description ? (
            <header className="mb-8 space-y-2">
              {title ? (
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-h1">
                  {title}
                </h1>
              ) : null}
              {description ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              ) : null}
              {headerExtra}
            </header>
          ) : null}

          {children}

          {footer ? (
            <div className="mt-8 border-t border-border/50 pt-6">
              {footer}
            </div>
          ) : null}
        </div>
      </m.div>
    )
  },
)
