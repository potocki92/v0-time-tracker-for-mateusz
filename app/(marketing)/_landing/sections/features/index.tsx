'use client'

import { useEffect, useState } from 'react'

import { motion } from 'framer-motion'
import {
  Calendar,
  Check,
  Clock,
  FileEdit,
  FileText,
  LineChart,
  Pause,
  Plug,
  Square,
  Timer,
} from 'lucide-react'

const START_SECONDS = 2 * 3600 + 14 * 60 + 8

function formatTime(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

// 35-cell bento calendar intensities — no Math.random(), seeded by hand
// Guaranteed highs at indices [4, 10, 16, 17, 22, 23, 28]
const BENTO_CAL: number[] = [
  1, 0, 2, 1, 3, // 0-4
  0, 1, 2, 0, 1, // 5-9
  3, 1, 0, 2, 1, // 10-14
  0, 3, 3, 1, 2, // 15-19 (16,17 = 3)
  0, 1, 3, 3, 0, // 20-24 (22,23 = 3)
  1, 2, 0, 3, 1, // 25-29 (28 = 3)
  0, 2, 1, 0, 2, // 30-34
]

const REPORT_BARS = [38, 60, 48, 80, 32, 55, 95]

type InvoiceStatus = 'Open' | 'Paid' | 'Draft'

const INVOICES: { id: string; status: InvoiceStatus; amount: string }[] = [
  { id: 'FR_5_04_2026', status: 'Open', amount: '€2,240' },
  { id: 'FR_4_04_2026', status: 'Paid', amount: '€1,295' },
  { id: 'FR_3_04_2026', status: 'Draft', amount: '€1,652' },
]

function InvoiceStatusChip({ status }: { status: InvoiceStatus }) {
  if (status === 'Paid')
    return (
      <span className='chip-emerald flex items-center gap-1 text-[10px]'>
        <Check size={9} />
        Paid
      </span>
    )
  if (status === 'Open') return <span className='chip-amber text-[10px]'>Open</span>
  return <span className='chip-mute text-[10px]'>Draft</span>
}

function BentoCalCell({ lvl }: { lvl: number }) {
  if (lvl === 0)
    return (
      <div
        className='h-6 rounded-md'
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--hair)' }}
      />
    )
  if (lvl === 1)
    return (
      <div
        className='h-6 rounded-md'
        style={{
          background: 'rgba(34,224,122,0.08)',
          border: '1px solid rgba(34,224,122,0.18)',
        }}
      />
    )
  if (lvl === 2)
    return (
      <div
        className='h-6 rounded-md'
        style={{
          background: 'rgba(34,224,122,0.18)',
          border: '1px solid rgba(34,224,122,0.30)',
        }}
      />
    )
  return <div className='day-active h-6 rounded-md' />
}

export function FeaturesSection() {
  const [seconds, setSeconds] = useState(START_SECONDS)

  useEffect(() => {
    const id = setInterval(() => setSeconds((prev) => prev + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className='relative pb-24 pt-32'>
      {/* Section intro */}
      <div className='mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8'>
        <div className='eyebrow mb-3'>Capabilities</div>
        <h2 className='display display-md ink-gradient max-w-[600px]'>
          Every tool, where you reach for it.
        </h2>

        {/* Bento grid */}
        <div className='mt-12 grid grid-cols-12 gap-4'>
          {/* 1. Live tracker — spans 7 cols */}
          <motion.div
            className='bento relative col-span-12 overflow-hidden lg:col-span-7'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Emerald orb */}
            <div
              aria-hidden='true'
              className='pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full'
              style={{
                background: 'radial-gradient(circle, rgba(34,224,122,0.18) 0%, transparent 70%)',
              }}
            />

            <div className='mb-1 flex items-center gap-2'>
              <Timer size={14} style={{ color: '#22E07A' }} />
              <span className='stat-label'>Live tracker</span>
            </div>
            <h3
              className='mb-2 text-[18px] font-semibold leading-snug'
              style={{ color: 'var(--ink-1)' }}
            >
              One key. Start, switch, stop.
            </h3>
            <p className='mb-5 max-w-[400px] text-[14px] leading-relaxed' style={{ color: 'var(--ink-2)' }}>
              Tap once to start. Every second counts — no friction, no form. Switch projects mid-session without losing a minute.
            </p>

            {/* Ticking clock panel */}
            <div
              className='inline-flex flex-col gap-2 rounded-xl p-4'
              style={{
                background: 'rgba(34,224,122,0.06)',
                border: '1px solid rgba(34,224,122,0.20)',
              }}
            >
              <div className='flex items-center gap-2'>
                <span className='live-dot' />
                <span className='text-[12px]' style={{ color: 'var(--ink-2)' }}>
                  Tracking · Im Winkel 51
                </span>
              </div>
              <div
                className='num tabular-nums'
                style={{ fontSize: '40px', color: '#22E07A', letterSpacing: '0.02em', lineHeight: 1 }}
              >
                {formatTime(seconds)}
              </div>
              <div className='flex items-center gap-2 pt-1'>
                <button
                  className='btn-ghost flex items-center gap-1.5 text-[12px]'
                  style={{ padding: '5px 12px' }}
                >
                  <Pause size={12} />
                  Pause
                </button>
                <button
                  className='btn-ghost flex items-center gap-1.5 text-[12px]'
                  style={{ padding: '5px 12px' }}
                >
                  <Square size={12} />
                  Stop
                </button>
              </div>
            </div>
          </motion.div>

          {/* 2. Calendar — spans 5 cols */}
          <motion.div
            className='bento col-span-12 sm:col-span-6 lg:col-span-5'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.07 }}
          >
            <div className='mb-1 flex items-center gap-2'>
              <Calendar size={14} style={{ color: '#22E07A' }} />
              <span className='stat-label'>Calendar</span>
            </div>
            <h3
              className='mb-2 text-[18px] font-semibold leading-snug'
              style={{ color: 'var(--ink-1)' }}
            >
              A month painted in hours.
            </h3>
            <p className='mb-4 text-[14px] leading-relaxed' style={{ color: 'var(--ink-2)' }}>
              Colour intensity shows effort at a glance. Drill into any day in one tap.
            </p>

            {/* Mini bento calendar 7×5 */}
            <div className='grid grid-cols-7 gap-1'>
              {BENTO_CAL.map((lvl, i) => (
                <BentoCalCell key={i} lvl={lvl} />
              ))}
            </div>
          </motion.div>

          {/* 3. Invoices — spans 4 cols */}
          <motion.div
            className='bento col-span-12 sm:col-span-6 lg:col-span-4'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className='mb-1 flex items-center gap-2'>
              <FileText size={14} style={{ color: '#22E07A' }} />
              <span className='stat-label'>Invoices</span>
            </div>
            <h3
              className='mb-3 text-[18px] font-semibold leading-snug'
              style={{ color: 'var(--ink-1)' }}
            >
              From timesheet to paid.
            </h3>
            <div className='flex flex-col gap-0'>
              {INVOICES.map((inv, i) => (
                <div
                  key={inv.id}
                  className='flex items-center justify-between py-2.5'
                  style={{
                    borderBottom:
                      i < INVOICES.length - 1 ? '1px solid var(--hair)' : undefined,
                  }}
                >
                  <div className='flex items-center gap-2'>
                    <FileEdit size={12} style={{ color: 'var(--ink-3)' }} />
                    <div>
                      <div
                        className='mono text-[11px]'
                        style={{ color: 'var(--ink-1)' }}
                      >
                        {inv.id}
                      </div>
                      <div className='mt-0.5'>
                        <InvoiceStatusChip status={inv.status} />
                      </div>
                    </div>
                  </div>
                  <span className='num text-[13px]'>{inv.amount}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 4. Reports — spans 4 cols */}
          <motion.div
            className='bento col-span-12 sm:col-span-6 lg:col-span-4'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.14 }}
          >
            <div className='mb-1 flex items-center gap-2'>
              <LineChart size={14} style={{ color: '#22E07A' }} />
              <span className='stat-label'>Reports</span>
            </div>
            <h3
              className='mb-2 text-[18px] font-semibold leading-snug'
              style={{ color: 'var(--ink-1)' }}
            >
              The story your hours tell.
            </h3>
            <p className='mb-4 text-[14px] leading-relaxed' style={{ color: 'var(--ink-2)' }}>
              Weekly and monthly breakdowns by client, project, and rate. Export to CSV in one click.
            </p>

            {/* Mini bar chart */}
            <div className='flex h-[56px] items-end gap-1.5'>
              {REPORT_BARS.map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-sm ${i === REPORT_BARS.length - 1 ? 'bar now' : 'bar'}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </motion.div>

          {/* 5. Integrations — spans 4 cols */}
          <motion.div
            className='bento col-span-12 sm:col-span-6 lg:col-span-4'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.18 }}
          >
            <div className='mb-1 flex items-center gap-2'>
              <Plug size={14} style={{ color: '#22E07A' }} />
              <span className='stat-label'>Integrations</span>
            </div>
            <h3
              className='mb-2 text-[18px] font-semibold leading-snug'
              style={{ color: 'var(--ink-1)' }}
            >
              Plugs into your stack.
            </h3>
            <p className='mb-4 text-[14px] leading-relaxed' style={{ color: 'var(--ink-2)' }}>
              Connect the tools you already use. Sync calendars, trigger invoices via Stripe, pipe updates to Slack.
            </p>
            <div className='flex flex-wrap gap-2'>
              {['Stripe SEPA', 'Google Cal', 'Slack', 'Linear', '+ 14 more'].map((chip) => (
                <span
                  key={chip}
                  className='pill text-[12px]'
                >
                  {chip}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
