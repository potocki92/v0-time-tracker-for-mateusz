'use client'

import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export function HeroFloatingCards() {
  return (
    <>
      {/* Floating chip LEFT */}
      <motion.div
        className="panel absolute -left-2 top-[120px] hidden w-[220px] xl:left-6 xl:block"
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="chip-emerald text-[11px]">✓ Paid</span>
          <span className="mono text-[11px]" style={{ color: 'var(--ink-3)' }}>
            INV‑2026‑038
          </span>
        </div>
        <div className="num text-[20px]" style={{ color: 'var(--ink-1)' }}>
          €1,296.00
        </div>
        <div className="mt-1 text-[11px]" style={{ color: 'var(--ink-3)' }}>
          Tomasz Ignor · 72h × €18
        </div>
      </motion.div>

      {/* Floating chip RIGHT */}
      <motion.div
        className="panel absolute -right-2 top-[260px] hidden w-[240px] xl:block"
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.75 }}
      >
        <div className="mb-2 flex items-center gap-2" style={{ color: '#22E07A' }}>
          <Zap size={14} />
          <span className="text-[12px] font-medium" style={{ color: 'var(--ink-1)' }}>
            Auto‑invoice ready
          </span>
        </div>
        <div className="text-[11px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
          52 entries grouped by project · €2,240 ready to send to Rafał Gawlik.
        </div>
        <a
          href="/auth/sign-up"
          className="mt-3 inline-block text-[12px] font-medium"
          style={{ color: '#22E07A' }}
        >
          Review draft →
        </a>
      </motion.div>
    </>
  )
}
