'use client'

import { motion } from 'framer-motion'

/**
 * Ambient background for auth pages.
 *
 * Layers:
 *  1. Dark-leaning radial gradient tinted with the active theme's primary.
 *  2. Two slow-drifting color orbs (Framer Motion).
 *  3. Subtle dot grid overlay that dims in dark mode.
 *
 * Respects `prefers-reduced-motion` — orbs stay static for users who opt out.
 */
export function AuthBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-background" />

      <motion.div
        initial={{ x: '-20%', y: '-10%', scale: 1 }}
        animate={{
          x: ['-20%', '-5%', '-20%'],
          y: ['-10%', '10%',  '-10%'],
          scale: [1, 1.08, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-0 top-0 h-[55vw] w-[55vw] rounded-full bg-primary/30 blur-[120px] motion-reduce:animate-none"
      />
      <motion.div
        initial={{ x: '20%', y: '20%', scale: 1 }}
        animate={{
          x: ['20%', '5%', '20%'],
          y: ['20%', '0%', '20%'],
          scale: [1, 1.12, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-0 right-0 h-[50vw] w-[50vw] rounded-full bg-chart-2/25 blur-[120px] motion-reduce:animate-none"
      />

      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          color: 'var(--foreground)',
        }}
      />
    </div>
  )
}
