'use client'

import type { ReactNode } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

interface ParallaxLayerProps {
  children: ReactNode
  offset?: number
  className?: string
}

export function ParallaxLayer({ children, offset = 80, className }: ParallaxLayerProps) {
  const shouldReduceMotion = useReducedMotion()
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 900], [0, offset])

  return (
    <motion.div className={className} style={shouldReduceMotion ? undefined : { y }}>
      {children}
    </motion.div>
  )
}
