'use client'

import type { ReactNode } from 'react'

import { m, useReducedMotion } from 'framer-motion'

interface BentoCardProps {
  className?: string
  delay?: number
  children: ReactNode
}

export function BentoCard({ className = '', delay = 0, children }: BentoCardProps) {
  const shouldReduceMotion = useReducedMotion()
  return (
    <m.div
      className={`bento ${className}`}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : delay }}
    >
      {children}
    </m.div>
  )
}
