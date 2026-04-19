'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

import { BRAND, Logo } from '@/components/brand/logo'

/**
 * Dedicated header for auth pages.
 *
 * Fixed at the top of the viewport, it carries the brand mark, the company
 * name, and a soft backdrop blur so content can scroll beneath it without
 * clashing with the glassmorphism cards.
 */
export function AuthBrandHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="sticky top-0 z-20 w-full border-b border-border/40 bg-background/50 backdrop-blur-lg"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href={BRAND.homeHref}
          aria-label={BRAND.name}
          className="group inline-flex items-center gap-3 rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="relative">
            <span
              aria-hidden="true"
              className="absolute -inset-1 rounded-full bg-primary/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100"
            />
            <Logo priority size="md" className="relative" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              {BRAND.name}
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {BRAND.tagline}
            </span>
          </span>
        </Link>

        <span
          aria-hidden="true"
          className="hidden text-xs text-muted-foreground/70 sm:block"
        >
          v3.0
        </span>
      </div>
    </motion.header>
  )
}
