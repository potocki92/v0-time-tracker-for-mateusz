'use client'

import { m, useScroll, useTransform, useReducedMotion } from 'framer-motion'

import { DashboardMockup } from './DashboardMockup'
import { HeroFloatingCards } from './HeroFloatingCards'
import { HeroIntro } from './HeroIntro'

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion()
  const { scrollY } = useScroll()
  const yOrb1 = useTransform(scrollY, [0, 900], [0, shouldReduceMotion ? 0 : 50])
  const yOrb2 = useTransform(scrollY, [0, 900], [0, shouldReduceMotion ? 0 : 30])
  const yOrb3 = useTransform(scrollY, [0, 900], [0, shouldReduceMotion ? 0 : 70])
  const yDevice = useTransform(scrollY, [0, 900], [0, shouldReduceMotion ? 0 : -25])

  return (
    <section id="top" className="relative overflow-hidden pb-14 pt-20 sm:pb-[100px] sm:pt-[120px]">
      {/* Orbs */}
      <m.div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-200px] top-[-100px] h-[600px] w-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(34,224,122,0.12) 0%, transparent 70%)',
          y: yOrb1,
        }}
      />
      <m.div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-150px] top-[200px] h-[500px] w-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(116,169,240,0.08) 0%, transparent 70%)',
          y: yOrb2,
        }}
      />
      <m.div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-100px] left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(34,224,122,0.06) 0%, transparent 70%)',
          y: yOrb3,
        }}
      />

      {/* Grid mesh */}
      <div aria-hidden="true" className="grid-mesh pointer-events-none absolute inset-0" />

      {/* Container */}
      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <HeroIntro />
        <HeroFloatingCards />

        {/* Device frame */}
        <m.div
          className="device noise mx-auto mt-10 max-w-[1080px] sm:mt-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          style={{ y: yDevice }}
        >
          <div className="device-glow" />
          <DashboardMockup />
        </m.div>
      </div>
    </section>
  )
}
