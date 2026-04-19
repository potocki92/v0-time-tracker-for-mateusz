'use client'

import * as React from 'react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

interface FormWrapperProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?:       React.ReactNode
  description?: React.ReactNode
  footer?:      React.ReactNode
  /** Removes the default glassmorphism card styling (useful for embedded forms). */
  bare?:        boolean
}

/**
 * Presentational shell for forms. Neutral by default — works in a modal,
 * a page, a drawer. On auth pages it becomes a glassmorphism card.
 */
export const FormWrapper = React.forwardRef<HTMLDivElement, FormWrapperProps>(
  function FormWrapper(
    { title, description, footer, bare, className, children, ...rest },
    ref,
  ) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={cn('w-full', !bare && 'max-w-md mx-auto')}
      >
        <div
          ref={ref}
          className={cn(
            !bare && [
              'relative overflow-hidden rounded-2xl',
              'border border-border/50',
              'bg-card/70 supports-[backdrop-filter]:bg-card/50 backdrop-blur-xl',
              'shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)]',
              'dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]',
            ],
            className,
          )}
          {...rest}
        >
          {!bare ? (
            <>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/20 blur-3xl"
              />
            </>
          ) : null}

          <div className={cn('relative p-6 sm:p-8', bare && 'p-0')}>
            {title || description ? (
              <header className="mb-6 space-y-1.5">
                {title ? (
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p className="text-sm text-muted-foreground">{description}</p>
                ) : null}
              </header>
            ) : null}

            {children}

            {footer ? (
              <div className="mt-6 border-t border-border/40 pt-5">
                {footer}
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    )
  },
)
