'use client'

import { useEffect, useRef } from 'react'

import { MARK_STATS } from './data'

export function IconicMarkSection() {
  const tick60Ref = useRef<SVGGElement>(null)
  const tick12Ref = useRef<SVGGElement>(null)

  useEffect(() => {
    const cx = 400
    const cy = 400

    if (tick60Ref.current) {
      for (let i = 0; i < 60; i++) {
        const ang = (i / 60) * Math.PI * 2 - Math.PI / 2
        const r1 = 360
        const r2 = i % 5 === 0 ? 340 : 350
        const x1 = cx + Math.cos(ang) * r1
        const y1 = cy + Math.sin(ang) * r1
        const x2 = cx + Math.cos(ang) * r2
        const y2 = cy + Math.sin(ang) * r2
        const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        ln.setAttribute('x1', String(x1))
        ln.setAttribute('y1', String(y1))
        ln.setAttribute('x2', String(x2))
        ln.setAttribute('y2', String(y2))
        ln.setAttribute('stroke', i % 5 === 0 ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.10)')
        ln.setAttribute('stroke-width', i % 5 === 0 ? '1.5' : '1')
        ln.setAttribute('stroke-linecap', 'round')
        tick60Ref.current.appendChild(ln)
      }
    }

    if (tick12Ref.current) {
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2 - Math.PI / 2
        const r1 = 290
        const r2 = 270
        const x1 = cx + Math.cos(ang) * r1
        const y1 = cy + Math.sin(ang) * r1
        const x2 = cx + Math.cos(ang) * r2
        const y2 = cy + Math.sin(ang) * r2
        const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        ln.setAttribute('x1', String(x1))
        ln.setAttribute('y1', String(y1))
        ln.setAttribute('x2', String(x2))
        ln.setAttribute('y2', String(y2))
        ln.setAttribute('stroke', i % 3 === 0 ? '#22E07A' : 'rgba(255,255,255,.5)')
        ln.setAttribute('stroke-width', i % 3 === 0 ? '2.5' : '1.5')
        ln.setAttribute('stroke-linecap', 'round')
        if (i % 3 === 0) ln.setAttribute('filter', 'url(#softGlow)')
        tick12Ref.current.appendChild(ln)
      }
    }
  }, [])

  return (
    <section className="relative py-28 sm:py-40 overflow-hidden">
      <div className="aurora">
        <div className="aurora-band" style={{ top: '20%' }} />
      </div>
      <div className="grid-mesh absolute inset-0" style={{ opacity: 0.25 }} />

      <div className="relative mx-auto max-w-[1280px] px-6 sm:px-8">
        <div className="text-center mb-12 sm:mb-16 reveal-row">
          <div className="sec-label justify-center">
            <span className="sec-dot" />
            The Mark · Identity
          </div>
          <h2 className="display display-md ink-gradient mt-5 max-w-[820px] mx-auto">
            A clock, considered.
          </h2>
          <p
            className="mt-5 max-w-[560px] mx-auto text-[15px] sm:text-[17px] leading-[1.55]"
            style={{ color: 'var(--ink-2)' }}
          >
            Every minute placed with intention. The mark below is the system itself — sixty ticks,
            twelve anchors, one center of focus.
          </p>
        </div>

        <div className="mark-stage">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(34,224,122,.30), rgba(34,224,122,.06) 40%, transparent 70%)',
              filter: 'blur(20px)',
            }}
          />
          <span
            className="particle"
            style={{ top: '18%', left: '22%', animation: 'drift1 7s ease-in-out infinite' }}
          />
          <span
            className="particle"
            style={{ top: '30%', right: '18%', animation: 'drift2 9s ease-in-out infinite', background: '#74A9F0' }}
          />
          <span
            className="particle"
            style={{ bottom: '24%', left: '30%', animation: 'drift3 8s ease-in-out infinite' }}
          />
          <span
            className="particle"
            style={{ bottom: '18%', right: '26%', animation: 'drift1 11s ease-in-out infinite' }}
          />
          <span
            className="particle"
            style={{ top: '10%', left: '50%', animation: 'drift2 6s ease-in-out infinite' }}
          />

          <svg
            className="relative w-full h-full"
            viewBox="0 0 800 800"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#6BF0A8" stopOpacity="1" />
                <stop offset="40%" stopColor="#22E07A" stopOpacity=".9" />
                <stop offset="100%" stopColor="#0B3A22" stopOpacity="0" />
              </radialGradient>
              <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="metalRing" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity=".25" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity=".08" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
              <path
                id="labelPath"
                d="M 400 400 m -360 0 a 360 360 0 1 1 720 0 a 360 360 0 1 1 -720 0"
              />
            </defs>

            <circle cx="400" cy="400" r="380" stroke="url(#metalRing)" strokeWidth="1" />
            <g className="mark-rotate" ref={tick60Ref} />
            <circle cx="400" cy="400" r="300" stroke="rgba(255,255,255,.08)" strokeWidth="1" />
            <g className="mark-rotate-rev" ref={tick12Ref} />
            <circle cx="400" cy="400" r="240" stroke="rgba(255,255,255,.04)" strokeWidth="2" />
            <circle
              cx="400"
              cy="400"
              r="240"
              stroke="#22E07A"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="1130 1508"
              strokeDashoffset="377"
              filter="url(#softGlow)"
              transform="rotate(-90 400 400)"
            />
            <circle cx="400" cy="400" r="170" stroke="rgba(34,224,122,.30)" strokeWidth="1" />
            <circle cx="400" cy="400" r="140" stroke="rgba(34,224,122,.18)" strokeWidth="1" />
            <circle cx="400" cy="400" r="80" fill="url(#centerGlow)" opacity=".95" />
            <circle cx="400" cy="400" r="6" fill="#FFFFFF" filter="url(#softGlow)" />
            <line x1="400" y1="400" x2="400" y2="220" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity=".9" />
            <line x1="400" y1="400" x2="560" y2="320" stroke="#22E07A" strokeWidth="2.5" strokeLinecap="round" filter="url(#softGlow)" />
            <text
              fontFamily="JetBrains Mono, monospace"
              fontSize="11"
              fill="rgba(255,255,255,.4)"
              letterSpacing="3"
            >
              <textPath href="#labelPath" startOffset="0">
                TIME · ACCOUNTED · FOR · TIME · ACCOUNTED · FOR ·{' '}
              </textPath>
            </text>
          </svg>
        </div>

        <div className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-[920px] mx-auto reveal-row">
          {MARK_STATS.map(({ val, label, green }) => (
            <div key={label} className="text-center">
              <div className={`num text-[22px] font-semibold ${green ? 'em-text' : ''}`}>{val}</div>
              <div
                className="text-[10.5px] uppercase tracking-[.14em] mt-1"
                style={{ color: 'var(--ink-3)' }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
