'use client'

import { useState } from 'react'

import { m, useReducedMotion } from 'framer-motion'
import { Timer } from 'lucide-react'

import { useTickingClock } from '../../hooks/useTickingClock'
import { formatTime } from '../../lib/format-time'
import {
  CHART_DATA,
  CHART_RANGES,
  KPI_ROWS,
  LIVE_ENTRIES,
  NAV_ITEMS,
  START_SECONDS,
  type ChartRange,
} from './data'

export function DashboardMockup() {
  const { seconds } = useTickingClock(START_SECONDS)
  const [range, setRange] = useState<ChartRange>('week')
  const shouldReduceMotion = useReducedMotion()
  const bars = CHART_DATA[range]
  const liveTime = formatTime(seconds)

  return (
    <div className="device-screen">
      <div className="grid h-full grid-cols-12">
        {/* Sidebar */}
        <aside
          className="col-span-3 hidden flex-col border-r sm:flex"
          style={{ borderColor: 'var(--hair)', padding: '20px 0' }}
        >
          <div className="mb-6 flex items-center gap-2 px-4">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md"
              style={{
                background: 'rgba(34,224,122,0.15)',
                border: '1px solid rgba(34,224,122,0.3)',
              }}
            >
              <Timer size={14} style={{ color: '#22E07A' }} />
            </div>
            <span className="text-[13px] font-semibold" style={{ color: 'var(--ink-1)' }}>
              TimeTracker
            </span>
          </div>

          <div className="mb-2 px-4">
            <span className="sec-label">Workspace</span>
          </div>

          <nav className="flex flex-col gap-0.5 px-2">
            {NAV_ITEMS.map(({ label, icon: Icon, active, badge }) => (
              <div
                key={label}
                className={`nav-item flex items-center gap-2.5 text-[12px] ${active ? 'active' : ''} ${badge ? 'justify-between' : ''}`}
              >
                {badge ? (
                  <>
                    <span className="flex items-center gap-2.5">
                      <Icon size={13} />
                      {label}
                    </span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px]"
                      style={{ background: 'rgba(34,224,122,0.12)', color: '#22E07A' }}
                    >
                      {badge}
                    </span>
                  </>
                ) : (
                  <>
                    <Icon size={13} />
                    {label}
                  </>
                )}
              </div>
            ))}
          </nav>

          {/* Live tracking panel */}
          <div className="mx-2 mt-auto">
            <div
              className="rounded-lg p-3"
              style={{
                background: 'rgba(34,224,122,0.06)',
                border: '1px solid rgba(34,224,122,0.18)',
              }}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <span className="live-dot" />
                <span className="text-[10px]" style={{ color: 'var(--ink-3)' }}>
                  Tracking
                </span>
              </div>
              <div className="text-[10px]" style={{ color: 'var(--ink-2)' }}>
                Im Winkel 51
              </div>
              <div
                className="mono mt-1.5 text-[18px] font-bold tabular-nums"
                style={{ color: '#22E07A', letterSpacing: '0.02em' }}
              >
                {liveTime}
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="col-span-12 flex flex-col gap-4 overflow-auto p-4 sm:col-span-9">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>
                April 2026 · Q2
              </div>
              <div className="text-[15px] font-semibold" style={{ color: 'var(--ink-1)' }}>
                This week, in focus.
              </div>
            </div>
            {/* Segmented control */}
            <div className="seg" role="tablist" aria-label="Chart range">
              {CHART_RANGES.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={range === key}
                  onClick={() => setRange(key)}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3">
            {KPI_ROWS.map((kpi) => (
              <div key={kpi.label} className="panel">
                <div className="stat-label">{kpi.label}</div>
                <div className="num mt-1 text-[18px]">{kpi.value}</div>
                <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>
                  {kpi.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Chart panel */}
          <div className="panel">
            <div className="mb-3 flex items-center justify-between">
              <span className="stat-label">Hours · last 12 {range === 'year' ? 'months' : 'weeks'}</span>
            </div>
            <div className="grid h-[72px] grid-cols-12 items-end gap-1.5">
              {bars.map((h, i) => (
                <m.div
                  key={i}
                  className={i === bars.length - 1 ? 'bar now' : 'bar'}
                  initial={shouldReduceMotion ? false : { height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.5,
                    delay: shouldReduceMotion ? 0 : i * 0.02,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              ))}
            </div>
          </div>

          {/* Live entries */}
          <div className="panel">
            <div className="stat-label mb-3">Live entries</div>
            <div className="flex flex-col">
              {LIVE_ENTRIES.map((entry, i) => (
                <div
                  key={entry.title}
                  className="flex items-center justify-between py-2"
                  style={
                    i < LIVE_ENTRIES.length - 1
                      ? { borderBottom: '1px solid var(--hair)' }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        background: entry.color,
                        boxShadow: entry.live ? `0 0 6px ${entry.color}` : undefined,
                      }}
                    />
                    <div>
                      <div className="text-[12px] font-medium" style={{ color: 'var(--ink-1)' }}>
                        {entry.title}
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>
                        {entry.sub}
                      </div>
                    </div>
                  </div>
                  {entry.live ? (
                    <span
                      className="mono tabular-nums text-[12px] font-semibold"
                      style={{ color: '#22E07A', minWidth: '68px', textAlign: 'right' }}
                    >
                      {liveTime}
                    </span>
                  ) : (
                    <span className="mono text-[12px]" style={{ color: 'var(--ink-2)' }}>
                      {entry.time}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
