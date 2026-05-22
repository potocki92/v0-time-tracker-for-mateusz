'use client'

import { useEffect, useRef, useState } from 'react'

import { AnimatePresence, motion } from 'framer-motion'

import { STEPS } from './data'
import { ScreenCalendar } from './screens/ScreenCalendar'
import { ScreenDashboard } from './screens/ScreenDashboard'
import { ScreenInvoices } from './screens/ScreenInvoices'

const SCREENS = [ScreenDashboard, ScreenCalendar, ScreenInvoices]

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
    <section id="product" className="relative">
      {/* Intro */}
      <div className="mx-auto max-w-[760px] px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="eyebrow mb-3">The product</div>
        <h2 className="display display-md ink-gradient">A surface for every hour you work.</h2>
        <p className="mt-4 text-[17px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
          Three views. One source of truth. Dashboard for the big picture, Calendar for the
          day-to-day, Invoices to get paid — all connected, all live.
        </p>
      </div>

      {/* Story grid */}
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-12 gap-10 lg:gap-16">
          {/* Left — story steps */}
          <div className="col-span-12 space-y-[40vh] py-[10vh] lg:col-span-5">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                ref={(el) => {
                  stepRefs.current[i] = el
                }}
                className="reveal-row"
              >
                <div className="sec-label mb-2 flex items-center gap-2">
                  <span className="sec-dot" />
                  {step.num} · {step.title}
                </div>
                <h3 className="display display-sm mb-3" style={{ color: 'var(--ink-1)' }}>
                  {step.heading}
                </h3>
                <p className="text-[15px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          {/* Right — sticky device */}
          <div className="col-span-12 hidden lg:col-span-7 lg:block">
            <div
              className="story-stage"
              style={{
                position: 'sticky',
                top: '96px',
                height: 'calc(100vh - 120px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div className="device w-full max-w-[560px]">
                <div className="device-glow" />
                <div className="device-screen" style={{ minHeight: '400px' }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeScreen}
                      className="h-full"
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
