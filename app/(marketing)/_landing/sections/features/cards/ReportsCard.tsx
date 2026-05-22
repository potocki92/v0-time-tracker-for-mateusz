'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { LineChart } from 'lucide-react'

import { BentoCard } from '../BentoCard'
import { REPORT_BARS } from '../data'

export function ReportsCard() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <BentoCard className="col-span-12 sm:col-span-6 lg:col-span-4" delay={0.14}>
      <div className="mb-1 flex items-center gap-2">
        <LineChart size={14} style={{ color: '#22E07A' }} />
        <span className="stat-label">Reports</span>
      </div>
      <h3 className="mb-2 text-[18px] font-semibold leading-snug" style={{ color: 'var(--ink-1)' }}>
        The story your hours tell.
      </h3>
      <p className="mb-4 text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
        Weekly and monthly breakdowns by client, project, and rate. Export to CSV in one click.
      </p>

      <div className="flex h-[56px] items-end gap-1.5">
        {REPORT_BARS.map((h, i) => (
          <motion.div
            key={i}
            className={`flex-1 rounded-sm ${i === REPORT_BARS.length - 1 ? 'bar now' : 'bar'}`}
            initial={shouldReduceMotion ? false : { height: 0 }}
            whileInView={{ height: `${h}%` }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.5,
              delay: shouldReduceMotion ? 0 : 0.2 + i * 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        ))}
      </div>
    </BentoCard>
  )
}
