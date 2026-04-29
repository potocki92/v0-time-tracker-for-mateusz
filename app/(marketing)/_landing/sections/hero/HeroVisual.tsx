'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Activity, CalendarDays, Clock3, FileText, TrendingUp } from 'lucide-react'

import { HERO_PROGRESS_ROWS } from './data'

function HeroProgressRows() {
  return (
    <div className="mt-6 space-y-3">
      {HERO_PROGRESS_ROWS.map((row, index) => (
        <div key={row.label}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{row.label}</span>
            <span className="font-mono tabular-nums text-muted-foreground">{row.time}</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-chart-2"
              initial={{ width: 0 }}
              whileInView={{ width: `${row.value}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.12, ease: 'easeOut' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function HeroVisual() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="relative" aria-hidden="true">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/20 via-chart-2/10 to-transparent blur-3xl" />

      <motion.div
        animate={shouldReduceMotion ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-8 top-12 z-10 hidden rounded-2xl border border-border/70 bg-background/80 p-4 shadow-xl backdrop-blur md:block"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clock3 className="size-4" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Dzisiejszy fokus</p>
            <p className="font-mono text-sm font-semibold">02:47:18</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={shouldReduceMotion ? undefined : { y: [0, 12, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-6 bottom-12 z-10 hidden rounded-2xl border border-border/70 bg-background/80 p-4 shadow-xl backdrop-blur md:block"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-success/10 text-success">
            <TrendingUp className="size-4" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Rentowność</p>
            <p className="font-mono text-sm font-semibold">+18%</p>
          </div>
        </div>
      </motion.div>

      <div className="rounded-[2rem] border border-border/70 bg-background/70 p-3 shadow-2xl shadow-primary/10 backdrop-blur-xl">
        <div className="flex items-center gap-1.5 px-2 py-1.5">
          <span className="size-2.5 rounded-full bg-destructive/70" />
          <span className="size-2.5 rounded-full bg-warning/80" />
          <span className="size-2.5 rounded-full bg-success/80" />
          <span className="ml-3 text-[11px] font-medium text-muted-foreground">
            workflow-pro.app/dashboard
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border bg-muted/30 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Aktywny projekt
                </p>
                <p className="mt-1 text-sm font-semibold">Redesign strony — Acme</p>
              </div>
              <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                ● Śledzenie
              </div>
            </div>

            <div className="mt-5 flex items-baseline gap-2">
              <span className="font-mono text-5xl font-semibold tabular-nums tracking-tight">
                02:47:18
              </span>
              <span className="text-xs text-muted-foreground">dzisiaj</span>
            </div>

            <HeroProgressRows />
          </div>

          <div className="grid grid-cols-3 divide-x divide-border">
            {[
              { icon: Activity, label: 'Tydzień', value: '34.2h' },
              { icon: FileText, label: 'Do faktury', value: '2 840 zł' },
              { icon: CalendarDays, label: 'Termin', value: 'Pt' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="p-4">
                <Icon className="size-4 text-primary" />
                <p className="mt-3 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 font-mono text-base font-semibold tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
