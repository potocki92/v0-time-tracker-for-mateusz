'use client'

import { m } from 'framer-motion'
import { ArrowRight, Check, Play } from 'lucide-react'

import { TRUST_BADGES } from './data'

export function HeroIntro() {
  return (
    <>
      {/* Live chip */}
      <div className="flex justify-center">
        <m.span
          className="live-chip group"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="dot" />
          v3.2 · Live tracking now in EU‑West
          <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
        </m.span>
      </div>

      {/* Headline */}
      <m.h1
        className="display display-lg mt-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <span className="ink-gradient">Time, </span>
        <span className="em-text">accounted</span>
        <span className="ink-gradient"> for.</span>
      </m.h1>

      {/* Subheadline */}
      <m.p
        className="mx-auto mt-6 max-w-[640px] text-center text-lg leading-relaxed"
        style={{ color: 'var(--ink-2)' }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.18 }}
      >
        Track every hour, invoice every euro. TimeTracker turns raw time into revenue — with a live
        timer, calendar, and one-click invoicing built for freelancers who mean business.
      </m.p>

      {/* CTAs */}
      <m.div
        className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.26 }}
      >
        <a href="/auth/sign-up" className="cta-primary">
          Start tracking free →
        </a>
        <a href="#product" className="cta-ghost">
          <Play size={14} className="mr-1.5 inline-block" />
          Watch demo
        </a>
      </m.div>

      {/* Trust badges */}
      <m.div
        className="mt-5 flex flex-wrap items-center justify-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.34 }}
      >
        {TRUST_BADGES.map((label) => (
          <span
            key={label}
            className="flex items-center gap-1.5 text-xs"
            style={{ color: 'var(--ink-3)' }}
          >
            <Check size={13} style={{ color: '#22E07A' }} />
            {label}
          </span>
        ))}
      </m.div>
    </>
  )
}
