'use client'

import * as React from 'react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

import { AuthBackground } from './AuthBackground'
import { AuthBrandHeader } from './AuthBrandHeader'

interface AuthShellProps {
  children: React.ReactNode
  /** Renders a narrower content column for single-card pages. Default: true. */
  compact?: boolean
  className?: string
}

/**
 * Layout for the entire /auth/* area.
 *
 * - Fixed branded header (logo + company name).
 * - Animated ambient background (glassmorphism-friendly).
 * - Skip-link target (`#main-content`) preserved for a11y.
 * - Content is centered vertically; paired with `compact` for narrow cards.
 */
export function AuthShell({ children, compact = true, className }: AuthShellProps) {
  return (
    <>
      <AuthBackground />
      <div className="flex min-h-screen flex-col">
        <AuthBrandHeader />
        <motion.main
          id="main-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className={cn(
            'flex flex-1 items-center justify-center px-4 py-10 sm:py-16',
            className,
          )}
        >
          <div
            className={cn(
              'w-full',
              compact ? 'max-w-md' : 'max-w-3xl',
            )}
          >
            {children}
          </div>
        </motion.main>
        <footer className="py-6 text-center text-xs text-muted-foreground/60">
          <p>© {new Date().getFullYear()} WorkFlow Pro. Wszystkie prawa zastrzeżone.</p>
        </footer>
      </div>
    </>
  )
}
