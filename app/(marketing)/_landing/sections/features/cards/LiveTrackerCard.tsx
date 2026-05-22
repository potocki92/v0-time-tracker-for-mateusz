'use client'

import { Pause, Play, Square, Timer } from 'lucide-react'

import { useTickingClock } from '../../../hooks/useTickingClock'
import { formatTime } from '../../../lib/format-time'
import { BentoCard } from '../BentoCard'
import { START_SECONDS } from '../data'

export function LiveTrackerCard() {
  const { seconds, paused, toggle, reset } = useTickingClock(START_SECONDS)

  return (
    <BentoCard className="relative col-span-12 overflow-hidden lg:col-span-7" delay={0}>
      {/* Emerald orb */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(34,224,122,0.18) 0%, transparent 70%)' }}
      />

      <div className="mb-1 flex items-center gap-2">
        <Timer size={14} style={{ color: '#22E07A' }} />
        <span className="stat-label">Live tracker</span>
      </div>
      <h3 className="mb-2 text-[18px] font-semibold leading-snug" style={{ color: 'var(--ink-1)' }}>
        One key. Start, switch, stop.
      </h3>
      <p className="mb-5 max-w-[400px] text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
        Tap once to start. Every second counts — no friction, no form. Switch projects mid-session
        without losing a minute.
      </p>

      {/* Ticking clock panel */}
      <div
        className="inline-flex flex-col gap-2 rounded-xl p-4"
        style={{ background: 'rgba(34,224,122,0.06)', border: '1px solid rgba(34,224,122,0.20)' }}
      >
        <div className="flex items-center gap-2">
          <span className="live-dot" style={paused ? { animation: 'none', opacity: 0.4 } : undefined} />
          <span className="text-[12px]" style={{ color: 'var(--ink-2)' }}>
            {paused ? 'Paused' : 'Tracking'} · Im Winkel 51
          </span>
        </div>
        <div
          className="num tabular-nums"
          style={{ fontSize: '40px', color: '#22E07A', letterSpacing: '0.02em', lineHeight: 1 }}
        >
          {formatTime(seconds)}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={toggle}
            aria-pressed={paused}
            className="btn-ghost flex items-center gap-1.5 text-[12px]"
            style={{ padding: '5px 12px' }}
          >
            {paused ? <Play size={12} /> : <Pause size={12} />}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            type="button"
            onClick={reset}
            className="btn-ghost flex items-center gap-1.5 text-[12px]"
            style={{ padding: '5px 12px' }}
          >
            <Square size={12} />
            Stop
          </button>
        </div>
      </div>
    </BentoCard>
  )
}
