'use client'

import { Clock3, Receipt, ShieldCheck, Users } from 'lucide-react'
import { motion } from 'framer-motion'

import { BRAND, Logo } from '@/components/brand/logo'

const FEATURES = [
  { icon: Clock3,      label: 'Śledź czas pracy w czasie rzeczywistym' },
  { icon: Receipt,     label: 'Wystawiaj faktury w kilka kliknięć' },
  { icon: Users,       label: 'Zarządzaj klientami w jednym miejscu' },
  { icon: ShieldCheck, label: 'Twoje dane są szyfrowane end-to-end' },
] as const

/**
 * Branded right-hand panel on auth pages.
 *
 * Full-bleed gradient built from the active theme's `--primary`, animated
 * orbs, subtle grid overlay. Stays within the theme tokens so that each
 * designer palette (emerald / ocean / etc.) projects its own identity.
 */
export function AuthShowcase() {
  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative hidden overflow-hidden lg:flex"
      aria-hidden="false"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(135deg,var(--primary)_0%,color-mix(in_oklab,var(--primary)_75%,black)_100%)]"
      />

      <motion.div
        aria-hidden="true"
        animate={{ scale: [1, 1.15, 1], x: [0, 24, 0], y: [0, -18, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/25 blur-3xl motion-reduce:animate-none"
      />
      <motion.div
        aria-hidden="true"
        animate={{ scale: [1, 1.12, 1], x: [0, -20, 0], y: [0, 24, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-[var(--chart-2)]/40 blur-3xl motion-reduce:animate-none"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      <div className="relative z-10 flex flex-col justify-between p-10 text-white xl:p-14">
        <div className="flex items-center gap-3">
          <span className="relative">
            <span className="absolute -inset-1 rounded-full bg-white/20 blur-md" aria-hidden="true" />
            <Logo priority size="md" className="relative drop-shadow" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            {BRAND.name}
          </span>
        </div>

        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-3"
          >
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
              {BRAND.tagline}
            </p>
            <h2 className="text-3xl font-semibold leading-[1.15] xl:text-[2.5rem]">
              Skup się na pracy.
              <br />
              <span className="text-white/80">Resztą zajmiemy się my.</span>
            </h2>
          </motion.div>

          <ul className="space-y-3.5">
            {FEATURES.map(({ icon: Icon, label }, i) => (
              <motion.li
                key={label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.22 + i * 0.08 }}
                className="flex items-center gap-3 text-sm text-white/90"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>{label}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/60">
          © {new Date().getFullYear()} {BRAND.name}. Wszystkie prawa zastrzeżone.
        </p>
      </div>
    </motion.aside>
  )
}
