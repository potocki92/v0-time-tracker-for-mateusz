'use client'

import { type CSSProperties, useEffect, useRef, useState } from 'react'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, Clock, FileEdit } from 'lucide-react'

const INTENSITIES = [
  0, 0,
  2, 3, 1, 0, 0,
  1, 3, 2, 2, 3, 0, 0,
  3, 2, 3, 3, 2, 0, 0,
  2, 3, 2, 3, 1, 0, 0,
  3, 2,
]

const CALENDAR_OFFSET = 2
const TODAY_INDEX = 21

const CASHFLOW_BARS = [35, 50, 30, 62, 24, 96]
const CASHFLOW_MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']

type InvoiceStatus = 'Open' | 'Paid' | 'Draft'

const INVOICES: { id: string; status: InvoiceStatus; amount: string }[] = [
  { id: 'FR_5_04_2026', status: 'Open', amount: '€2,240' },
  { id: 'FR_4_04_2026', status: 'Paid', amount: '€1,295' },
  { id: 'FR_3_04_2026', status: 'Draft', amount: '€1,652' },
]

function statusChip(status: InvoiceStatus) {
  if (status === 'Paid')
    return (
      <span className='chip-emerald flex items-center gap-1 text-[10px]'>
        <Check size={9} />
        Paid
      </span>
    )
  if (status === 'Open')
    return <span className='chip-amber text-[10px]'>Open</span>
  return <span className='chip-mute text-[10px]'>Draft</span>
}

function calDayClass(cellIndex: number, dataIndex: number): string {
  if (dataIndex < 0 || dataIndex >= INTENSITIES.length) return 'day-empty'
  if (cellIndex - CALENDAR_OFFSET === TODAY_INDEX) return 'day-today'
  const lvl = INTENSITIES[dataIndex]
  if (lvl === 0) return 'day-off'
  if (lvl === 3) return 'day-active'
  return ''
}

function calDayStyle(cellIndex: number, dataIndex: number): CSSProperties {
  if (dataIndex < 0 || dataIndex >= INTENSITIES.length) return {}
  if (cellIndex - CALENDAR_OFFSET === TODAY_INDEX) return {}
  const lvl = INTENSITIES[dataIndex]
  if (lvl === 1)
    return {
      background: 'rgba(34,224,122,0.08)',
      border: '1px solid rgba(34,224,122,0.18)',
    }
  if (lvl === 2)
    return {
      background: 'rgba(34,224,122,0.18)',
      border: '1px solid rgba(34,224,122,0.30)',
    }
  return {}
}

function ScreenDashboard() {
  return (
    <div className='flex h-full flex-col gap-3 p-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='text-[13px] font-semibold' style={{ color: 'var(--ink-1)' }}>
          Dashboard · April
        </div>
        <span className='chip-emerald flex items-center gap-1.5 text-[11px]'>
          <span
            className='live-dot'
            style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22E07A' }}
          />
          Live
        </span>
      </div>

      {/* KPI panels */}
      <div className='grid grid-cols-3 gap-2'>
        {[
          { label: 'Tracked', value: '163.2h' },
          { label: 'Billable', value: '€5,563', em: true },
          { label: 'Outstanding', value: '€2,436' },
        ].map((kpi) => (
          <div key={kpi.label} className='panel'>
            <div className='stat-label text-[10px]'>{kpi.label}</div>
            <div
              className={`num mt-1 text-[16px] ${kpi.em ? 'em-text' : ''}`}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Cashflow chart */}
      <div className='panel flex-1'>
        <div className='stat-label mb-3 text-[11px]'>Cashflow · 6 mo</div>
        <div className='flex h-[56px] items-end gap-1.5'>
          {CASHFLOW_BARS.map((h, i) => (
            <div
              key={i}
              className={`flex-1 ${i === CASHFLOW_BARS.length - 1 ? 'bar now' : 'bar'}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className='mt-1.5 flex gap-1.5'>
          {CASHFLOW_MONTHS.map((m) => (
            <div
              key={m}
              className='flex-1 text-center text-[9px]'
              style={{ color: 'var(--ink-3)' }}
            >
              {m}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ScreenCalendar() {
  const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const totalCells = 35

  return (
    <div className='flex h-full flex-col gap-3 p-4'>
      {/* Header */}
      <div className='text-[13px] font-semibold' style={{ color: 'var(--ink-1)' }}>
        Calendar · April 2026
      </div>

      {/* Day headers */}
      <div className='grid grid-cols-7 gap-1'>
        {DAY_HEADERS.map((d, i) => (
          <div
            key={i}
            className='text-center text-[10px]'
            style={{ color: 'var(--ink-3)' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className='grid grid-cols-7 gap-1'>
        {Array.from({ length: totalCells }).map((_, cellIndex) => {
          const dataIndex = cellIndex - CALENDAR_OFFSET
          const dayNum = dataIndex + 1
          const isEmpty = dataIndex < 0 || dataIndex >= 30
          const isToday = dataIndex === TODAY_INDEX

          if (isEmpty) {
            return (
              <div
                key={cellIndex}
                className='day-empty aspect-square rounded-md text-[10px]'
              />
            )
          }

          return (
            <div
              key={cellIndex}
              className={`aspect-square rounded-md text-[10px] flex items-center justify-center ${isToday ? 'day-today' : calDayClass(cellIndex, dataIndex)}`}
              style={isToday ? {} : calDayStyle(cellIndex, dataIndex)}
            >
              <span style={{ color: isToday ? '#22E07A' : 'var(--ink-3)' }}>{dayNum}</span>
            </div>
          )
        })}
      </div>

      {/* Detail panel */}
      <div className='panel mt-auto'>
        <div className='mb-2 flex items-center justify-between'>
          <span className='text-[11px] font-medium' style={{ color: 'var(--ink-1)' }}>
            Apr 22 · Wed
          </span>
          <span className='num text-[13px]'>8.5h</span>
        </div>
        <div className='flex flex-col gap-1.5'>
          {[
            { color: '#22E07A', label: 'Foundation review', time: '3.5h' },
            { color: '#74A9F0', label: 'Strategy sync', time: '1.5h' },
            { color: '#E66F8E', label: 'Site visit', time: '3.5h' },
          ].map((entry) => (
            <div key={entry.label} className='flex items-center gap-2'>
              <div
                className='h-3 w-1 rounded-full shrink-0'
                style={{ background: entry.color }}
              />
              <span className='flex-1 text-[11px]' style={{ color: 'var(--ink-2)' }}>
                {entry.label}
              </span>
              <span className='mono text-[10px]' style={{ color: 'var(--ink-3)' }}>
                {entry.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ScreenInvoices() {
  return (
    <div className='flex h-full flex-col gap-3 p-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='text-[13px] font-semibold' style={{ color: 'var(--ink-1)' }}>
          Invoices · April
        </div>
        <span className='chip-emerald text-[11px]'>2 paid</span>
      </div>

      {/* Invoice table */}
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
            <div className='flex items-center gap-2.5'>
              <FileEdit size={13} style={{ color: 'var(--ink-3)' }} />
              <div>
                <div
                  className='mono text-[11px] font-medium'
                  style={{ color: 'var(--ink-1)' }}
                >
                  {inv.id}
                </div>
                <div className='mt-0.5'>{statusChip(inv.status)}</div>
              </div>
            </div>
            <span className='num text-[13px]' style={{ color: 'var(--ink-1)' }}>
              {inv.amount}
            </span>
          </div>
        ))}
      </div>

      <div className='mt-auto'>
        <button className='cta-primary w-full text-center text-[12px]'>
          Send 1 draft →
        </button>
      </div>
    </div>
  )
}

const SCREENS = [ScreenDashboard, ScreenCalendar, ScreenInvoices]

const STEPS = [
  {
    num: '01',
    title: 'Dashboard',
    heading: 'See the week without squinting.',
    body: 'Every hour tracked lands on one surface — KPIs, cashflow chart, live entries. Refresh is instant. Decisions are faster.',
  },
  {
    num: '02',
    title: 'Calendar',
    heading: 'Every day, plotted precisely.',
    body: 'A colour-density calendar shows exactly where your time went. Tap any day to see the full breakdown. No more mental arithmetic.',
  },
  {
    num: '03',
    title: 'Invoices',
    heading: (
      <>
        Send <span className='em-text'>paid.</span> Not chased.
      </>
    ),
    body: 'Group entries by project, set your rate, hit send. TimeTracker converts tracked hours into a clean invoice in seconds, not minutes.',
  },
]

export function FeatureShowcaseSection() {
  const [activeScreen, setActiveScreen] = useState(0)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const handleScroll = () => {
      const viewportMid = window.innerHeight / 2
      let closest = 0
      let closestDist = Infinity

      stepRefs.current.forEach((el, i) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        const elMid = rect.top + rect.height / 2
        const dist = Math.abs(elMid - viewportMid)
        if (dist < closestDist) {
          closestDist = dist
          closest = i
        }
      })

      setActiveScreen(closest)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const ActiveScreen = SCREENS[activeScreen]

  return (
    <section id='product' className='relative'>
      {/* Intro */}
      <div className='mx-auto max-w-[760px] px-4 pb-16 pt-24 sm:px-6 lg:px-8'>
        <div className='eyebrow mb-3'>The product</div>
        <h2 className='display display-md ink-gradient'>
          A surface for every hour you work.
        </h2>
        <p className='mt-4 text-[17px] leading-relaxed' style={{ color: 'var(--ink-2)' }}>
          Three views. One source of truth. Dashboard for the big picture, Calendar for the day-to-day, Invoices to get paid — all connected, all live.
        </p>
      </div>

      {/* Story grid */}
      <div className='mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-12 gap-10 lg:gap-16'>
          {/* Left — story steps */}
          <div className='col-span-12 space-y-[40vh] py-[10vh] lg:col-span-5'>
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                ref={(el) => { stepRefs.current[i] = el }}
                className='reveal-row'
              >
                <div className='sec-label mb-2 flex items-center gap-2'>
                  <span className='sec-dot' />
                  {step.num} · {step.title}
                </div>
                <h3 className='display display-sm mb-3' style={{ color: 'var(--ink-1)' }}>
                  {step.heading}
                </h3>
                <p className='text-[15px] leading-relaxed' style={{ color: 'var(--ink-2)' }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          {/* Right — sticky device */}
          <div className='col-span-12 hidden lg:col-span-7 lg:block'>
            <div
              className='story-stage'
              style={{
                position: 'sticky',
                top: '96px',
                height: 'calc(100vh - 120px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div className='device w-full max-w-[560px]'>
                <div className='device-glow' />
                <div className='device-screen' style={{ minHeight: '400px' }}>
                  <AnimatePresence mode='wait'>
                    <motion.div
                      key={activeScreen}
                      className='h-full'
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ActiveScreen />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
