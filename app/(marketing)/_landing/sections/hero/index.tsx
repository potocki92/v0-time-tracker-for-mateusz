'use client'

import { useEffect, useState } from 'react'

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  Calendar,
  Check,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Pause,
  Play,
  Square,
  Timer,
  Users,
  Zap,
} from 'lucide-react'

const START_SECONDS = 2 * 3600 + 14 * 60 + 8
const BAR_HEIGHTS = [38, 52, 30, 64, 44, 70, 36, 58, 48, 78, 42, 92]

function formatTime(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function HeroSection() {
  const [seconds, setSeconds] = useState(START_SECONDS)
  const shouldReduceMotion = useReducedMotion()
  const { scrollY } = useScroll()
  const yOrb1 = useTransform(scrollY, [0, 900], [0, shouldReduceMotion ? 0 : 50])
  const yOrb2 = useTransform(scrollY, [0, 900], [0, shouldReduceMotion ? 0 : 30])
  const yOrb3 = useTransform(scrollY, [0, 900], [0, shouldReduceMotion ? 0 : 70])
  const yDevice = useTransform(scrollY, [0, 900], [0, shouldReduceMotion ? 0 : -25])

  useEffect(() => {
    const id = setInterval(() => setSeconds((prev) => prev + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <section id='top' className='relative overflow-hidden pb-14 pt-20 sm:pb-[100px] sm:pt-[120px]'>
      {/* Orb 1 */}
      <motion.div
        aria-hidden='true'
        className='pointer-events-none absolute left-[-200px] top-[-100px] h-[600px] w-[600px] rounded-full'
        style={{
          background: 'radial-gradient(circle, rgba(34,224,122,0.12) 0%, transparent 70%)',
          y: yOrb1,
        }}
      />
      {/* Orb 2 */}
      <motion.div
        aria-hidden='true'
        className='pointer-events-none absolute right-[-150px] top-[200px] h-[500px] w-[500px] rounded-full'
        style={{
          background: 'radial-gradient(circle, rgba(116,169,240,0.08) 0%, transparent 70%)',
          y: yOrb2,
        }}
      />
      {/* Orb 3 */}
      <motion.div
        aria-hidden='true'
        className='pointer-events-none absolute bottom-[-100px] left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full'
        style={{
          background: 'radial-gradient(circle, rgba(34,224,122,0.06) 0%, transparent 70%)',
          y: yOrb3,
        }}
      />

      {/* Grid mesh */}
      <div aria-hidden='true' className='grid-mesh pointer-events-none absolute inset-0' />

      {/* Container */}
      <div className='relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8'>
        {/* Live chip */}
        <div className='flex justify-center'>
          <motion.span
            className='live-chip group'
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 12px 7px 10px',
              borderRadius: '999px',
              background: 'rgba(34,224,122,0.10)',
              border: '1px solid rgba(34,224,122,0.30)',
              color: '#C8F8DF',
              fontSize: '12px',
            }}
          >
            <span
              className='dot'
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#22E07A',
                boxShadow: '0 0 6px #22E07A',
                animation: 'pulseDot 2s ease-in-out infinite',
                flexShrink: 0,
              }}
            />
            v3.2 · Live tracking now in EU‑West
            <ArrowRight size={12} className='transition-transform group-hover:translate-x-0.5' />
          </motion.span>
        </div>

        {/* Headline */}
        <motion.h1
          className='display display-lg mt-6 text-center'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <span className='ink-gradient'>Time, </span>
          <span className='em-text'>accounted</span>
          <span className='ink-gradient'> for.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className='mx-auto mt-6 max-w-[640px] text-center text-[18px] leading-relaxed'
          style={{ color: 'var(--ink-2)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
        >
          Track every hour, invoice every euro. TimeTracker turns raw time into revenue — with a
          live timer, calendar, and one-click invoicing built for freelancers who mean business.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className='mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row'
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.26 }}
        >
          <a href='/auth/sign-up' className='cta-primary'>Start tracking free →</a>
          <a href='#product' className='cta-ghost'>
            <Play size={14} className='mr-1.5 inline-block' />
            Watch demo
          </a>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          className='mt-5 flex flex-wrap items-center justify-center gap-4'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.34 }}
        >
          {['No credit card', '14-day Pro trial', 'Cancel anytime'].map((label) => (
            <span
              key={label}
              className='flex items-center gap-1.5 text-[13px]'
              style={{ color: 'var(--ink-3)' }}
            >
              <Check size={13} style={{ color: '#22E07A' }} />
              {label}
            </span>
          ))}
        </motion.div>

        {/* Floating chip LEFT */}
        <motion.div
          className='panel absolute -left-2 top-[120px] hidden w-[220px] xl:block xl:left-6'
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <div className='mb-2 flex items-center gap-2'>
            <span className='chip-emerald text-[11px]'>✓ Paid</span>
            <span className='mono text-[11px]' style={{ color: 'var(--ink-3)' }}>
              INV‑2026‑038
            </span>
          </div>
          <div className='num text-[20px]' style={{ color: 'var(--ink-1)' }}>
            €1,296.00
          </div>
          <div className='mt-1 text-[11px]' style={{ color: 'var(--ink-3)' }}>
            Tomasz Ignor · 72h × €18
          </div>
        </motion.div>

        {/* Floating chip RIGHT */}
        <motion.div
          className='panel absolute -right-2 top-[260px] hidden w-[240px] xl:block'
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.75 }}
        >
          <div className='mb-2 flex items-center gap-2' style={{ color: '#22E07A' }}>
            <Zap size={14} />
            <span className='text-[12px] font-medium' style={{ color: 'var(--ink-1)' }}>
              Auto‑invoice ready
            </span>
          </div>
          <div className='text-[11px] leading-relaxed' style={{ color: 'var(--ink-2)' }}>
            52 entries grouped by project · €2,240 ready to send to Rafał Gawlik.
          </div>
          <button
            className='mt-3 text-[12px] font-medium'
            style={{
              color: '#22E07A',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Review draft →
          </button>
        </motion.div>

        {/* Device frame */}
        <motion.div
          className='device noise mx-auto mt-10 max-w-[1080px] sm:mt-20'
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          style={{ y: yDevice }}
        >
          <div className='device-glow' />
          <div className='device-screen'>
            <div className='grid h-full grid-cols-12'>
              {/* Sidebar */}
              <aside
                className='col-span-3 hidden flex-col border-r sm:flex'
                style={{ borderColor: 'var(--hair)', padding: '20px 0' }}
              >
                {/* Logo */}
                <div className='mb-6 flex items-center gap-2 px-4'>
                  <div
                    className='flex h-7 w-7 items-center justify-center rounded-md'
                    style={{
                      background: 'rgba(34,224,122,0.15)',
                      border: '1px solid rgba(34,224,122,0.3)',
                    }}
                  >
                    <Timer size={14} style={{ color: '#22E07A' }} />
                  </div>
                  <span className='text-[13px] font-semibold' style={{ color: 'var(--ink-1)' }}>
                    TimeTracker
                  </span>
                </div>

                {/* Section label */}
                <div className='mb-2 px-4'>
                  <span className='sec-label'>Workspace</span>
                </div>

                {/* Nav items */}
                <nav className='flex flex-col gap-0.5 px-2'>
                  <div className='nav-item active flex items-center gap-2.5 text-[12px]'>
                    <LayoutDashboard size={13} />
                    Dashboard
                  </div>
                  <div className='nav-item flex items-center gap-2.5 text-[12px]'>
                    <Calendar size={13} />
                    Calendar
                  </div>
                  <div className='nav-item flex items-center justify-between gap-2.5 text-[12px]'>
                    <span className='flex items-center gap-2.5'>
                      <FolderKanban size={13} />
                      Projects
                    </span>
                    <span
                      className='rounded px-1.5 py-0.5 text-[10px]'
                      style={{ background: 'rgba(34,224,122,0.12)', color: '#22E07A' }}
                    >
                      4
                    </span>
                  </div>
                  <div className='nav-item flex items-center justify-between gap-2.5 text-[12px]'>
                    <span className='flex items-center gap-2.5'>
                      <Users size={13} />
                      Clients
                    </span>
                    <span
                      className='rounded px-1.5 py-0.5 text-[10px]'
                      style={{ background: 'rgba(34,224,122,0.12)', color: '#22E07A' }}
                    >
                      7
                    </span>
                  </div>
                  <div className='nav-item flex items-center justify-between gap-2.5 text-[12px]'>
                    <span className='flex items-center gap-2.5'>
                      <FileText size={13} />
                      Invoices
                    </span>
                    <span
                      className='rounded px-1.5 py-0.5 text-[10px]'
                      style={{ background: 'rgba(34,224,122,0.12)', color: '#22E07A' }}
                    >
                      5
                    </span>
                  </div>
                </nav>

                {/* Live tracking panel */}
                <div className='mx-2 mt-auto'>
                  <div
                    className='rounded-lg p-3'
                    style={{
                      background: 'rgba(34,224,122,0.06)',
                      border: '1px solid rgba(34,224,122,0.18)',
                    }}
                  >
                    <div className='mb-1 flex items-center gap-1.5'>
                      <span className='live-dot' />
                      <span className='text-[10px]' style={{ color: 'var(--ink-3)' }}>
                        Tracking
                      </span>
                    </div>
                    <div className='text-[10px]' style={{ color: 'var(--ink-2)' }}>
                      Im Winkel 51
                    </div>
                    <div
                      className='mono mt-1.5 text-[18px] font-bold tabular-nums'
                      style={{ color: '#22E07A', letterSpacing: '0.02em' }}
                    >
                      {formatTime(seconds)}
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main content */}
              <main className='col-span-12 flex flex-col gap-4 overflow-auto p-4 sm:col-span-9'>
                {/* Header */}
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='text-[10px]' style={{ color: 'var(--ink-3)' }}>
                      April 2026 · Q2
                    </div>
                    <div className='text-[15px] font-semibold' style={{ color: 'var(--ink-1)' }}>
                      This week, in focus.
                    </div>
                  </div>
                  {/* Segmented control */}
                  <div
                    className='flex rounded-md'
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--hair)',
                      padding: '2px',
                    }}
                  >
                    {['Week', 'Month', 'Year'].map((label, i) => (
                      <button
                        key={label}
                        className='seg'
                        style={{
                          background: i === 0 ? 'rgba(255,255,255,0.08)' : 'transparent',
                          fontSize: '11px',
                          padding: '3px 10px',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          color: i === 0 ? 'var(--ink-1)' : 'var(--ink-3)',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* KPI row */}
                <div className='grid grid-cols-3 gap-3'>
                  {[
                    { label: 'Tracked', value: '163.2h', sub: 'this period' },
                    { label: 'Billable', value: '€5,563', sub: 'invoiceable' },
                    { label: 'Outstanding', value: '€2,436', sub: 'awaiting payment' },
                  ].map((kpi) => (
                    <div key={kpi.label} className='panel'>
                      <div className='stat-label'>{kpi.label}</div>
                      <div className='num mt-1 text-[18px]'>{kpi.value}</div>
                      <div className='text-[10px]' style={{ color: 'var(--ink-3)' }}>
                        {kpi.sub}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart panel */}
                <div className='panel'>
                  <div className='mb-3 flex items-center justify-between'>
                    <span className='stat-label'>Hours · last 12 weeks</span>
                  </div>
                  <div className='grid h-[72px] grid-cols-12 items-end gap-1.5'>
                    {BAR_HEIGHTS.map((h, i) => (
                      <div
                        key={i}
                        className={i === BAR_HEIGHTS.length - 1 ? 'bar now' : 'bar'}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Live entries */}
                <div className='panel'>
                  <div className='stat-label mb-3'>Live entries</div>
                  <div className='flex flex-col'>
                    {/* Entry 1 — green / live */}
                    <div
                      className='flex items-center justify-between py-2'
                      style={{ borderBottom: '1px solid var(--hair)' }}
                    >
                      <div className='flex items-center gap-2.5'>
                        <span
                          className='h-2 w-2 shrink-0 rounded-full'
                          style={{ background: '#22E07A', boxShadow: '0 0 6px #22E07A' }}
                        />
                        <div>
                          <div
                            className='text-[12px] font-medium'
                            style={{ color: 'var(--ink-1)' }}
                          >
                            Im Winkel 51 · Foundation review
                          </div>
                          <div className='text-[10px]' style={{ color: 'var(--ink-3)' }}>
                            Rafał Gawlik
                          </div>
                        </div>
                      </div>
                      <span
                        className='mono tabular-nums text-[12px] font-semibold'
                        style={{ color: '#22E07A', minWidth: '68px', textAlign: 'right' }}
                      >
                        {formatTime(seconds)}
                      </span>
                    </div>
                    {/* Entry 2 — blue */}
                    <div
                      className='flex items-center justify-between py-2'
                      style={{ borderBottom: '1px solid var(--hair)' }}
                    >
                      <div className='flex items-center gap-2.5'>
                        <span
                          className='h-2 w-2 shrink-0 rounded-full'
                          style={{ background: '#74A9F0' }}
                        />
                        <div>
                          <div
                            className='text-[12px] font-medium'
                            style={{ color: 'var(--ink-1)' }}
                          >
                            Q2 retainer · Strategy sync
                          </div>
                          <div className='text-[10px]' style={{ color: 'var(--ink-3)' }}>
                            JH Smart Solutions
                          </div>
                        </div>
                      </div>
                      <span className='mono text-[12px]' style={{ color: 'var(--ink-2)' }}>
                        1.5h
                      </span>
                    </div>
                    {/* Entry 3 — pink */}
                    <div className='flex items-center justify-between py-2'>
                      <div className='flex items-center gap-2.5'>
                        <span
                          className='h-2 w-2 shrink-0 rounded-full'
                          style={{ background: '#E66F8E' }}
                        />
                        <div>
                          <div
                            className='text-[12px] font-medium'
                            style={{ color: 'var(--ink-1)' }}
                          >
                            Hans‑Böckler‑Str. 284 · Site visit
                          </div>
                          <div className='text-[10px]' style={{ color: 'var(--ink-3)' }}>
                            Tomasz Ignor
                          </div>
                        </div>
                      </div>
                      <span className='mono text-[12px]' style={{ color: 'var(--ink-2)' }}>
                        4.0h
                      </span>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #22E07A; }
          50% { opacity: 0.5; box-shadow: 0 0 2px #22E07A; }
        }
      `}</style>
    </section>
  )
}
