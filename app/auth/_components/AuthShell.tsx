'use client'

import * as React from 'react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'
import { BRAND, Logo } from '@/components/brand/logo'

import { AuthBackground } from './AuthBackground'
import { AuthShowcase } from './AuthShowcase'

interface AuthShellProps {
  children:  React.ReactNode
  className?: string
}

/**
 * Split-card layout for every /auth/* route.
 *
 * Left column — form area on a solid `bg-card` surface, generous padding,
 * a compact brand mark that shows only on mobile (where the showcase is
 * hidden).
 *
 * Right column — AuthShowcase gradient panel, visible on `lg+` screens,
 * keeps its identity from the active theme's `--primary` token.
 *
 * The outer card uses a single elevated shadow, not glassmorphism — the
 * composition feels closer to a premium SaaS dashboard panel than a
 * floating chip.
 */
export function AuthShell({ children, className }: AuthShellProps) {
  return (
    <>
      <AuthBackground />
      <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'relative w-full max-w-6xl overflow-hidden rounded-[28px] border border-border/60',
            'bg-card shadow-[0_24px_60px_-20px_rgba(0,0,0,0.25)] dark:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]',
            className,
          )}
        >
          <div className="grid lg:grid-cols-[1fr_1.1fr]">
            <main
              id="main-content"
              className="flex min-h-[640px] flex-col justify-center px-6 py-10 sm:px-12 lg:px-14 lg:py-16"
            >
              <div className="mx-auto flex w-full max-w-md flex-col gap-8">
                <div className="flex items-center gap-3 lg:hidden">
                  <Logo priority size="md" />
                  <span className="text-base font-semibold tracking-tight">
                    {BRAND.name}
                  </span>
                </div>

                {children}
              </div>
            </main>

            <AuthShowcase />
          </div>
        </motion.div>
      </div>
    </>
  )
}
