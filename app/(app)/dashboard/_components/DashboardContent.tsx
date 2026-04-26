'use client'

import { Suspense } from 'react'
import {
  ActivitySection,
  DashboardRangeProvider,
  EarningsSection,
  EffectiveRateSection,
  GoalSection,
  HeaderSection,
  HoursSection,
  InvoicesSection,
  ProjectsSection,
  QuickActionsSection,
  UpcomingSection,
  WeeklyGlanceSection,
} from './sections'
import {
  ChartSkeleton,
  HeaderSkeleton,
  InvoicesSkeleton,
  KpiSkeleton,
  StatsSkeleton,
} from './skeletons'
import { Footer, SectionHeader } from './linear'

/**
 * Linear-style dark dashboard, mobile-first, single column.
 *
 * Order (top → bottom):
 *   - TopBar + HeroGreeting + period tabs
 *   - Earnings (area chart + forecast)
 *   - Monthly goal (circular + surplus + streak)
 *   - Hours (progress + heatmap grid)
 *   - Effective rate (per-client bars)
 *   - Activity (stat tiles + recent feed)
 *   - SCHEDULE & BILLING ─ Projects, Invoices
 *   - UP NEXT ─ Upcoming
 *   - Quick actions (6 tiles)
 *   - This week at a glance (bar chart)
 *   - Footer (synced/version)
 *   - Bottom nav (sticky)
 */
export function DashboardContent() {
  return (
    <DashboardRangeProvider>
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto w-full max-w-2xl space-y-5 px-3 pb-28 pt-2 sm:px-4">
          <Suspense fallback={<HeaderSkeleton />}>
            <HeaderSection />
          </Suspense>

          <Suspense fallback={<KpiSkeleton />}>
            <EarningsSection />
          </Suspense>

          <Suspense fallback={<KpiSkeleton />}>
            <GoalSection />
          </Suspense>

          <Suspense fallback={<ChartSkeleton />}>
            <HoursSection />
          </Suspense>

          <Suspense fallback={<StatsSkeleton />}>
            <EffectiveRateSection />
          </Suspense>

          <Suspense fallback={<StatsSkeleton />}>
            <ActivitySection />
          </Suspense>

          <SectionHeader label="Harmonogram i rozliczenia" />

          <Suspense fallback={<InvoicesSkeleton />}>
            <ProjectsSection />
          </Suspense>

          <Suspense fallback={<InvoicesSkeleton />}>
            <InvoicesSection />
          </Suspense>

          <SectionHeader label="Wkrótce" />

          <Suspense fallback={<InvoicesSkeleton />}>
            <UpcomingSection />
          </Suspense>

          <QuickActionsSection />

          <Suspense fallback={<ChartSkeleton />}>
            <WeeklyGlanceSection />
          </Suspense>

          <Footer />
        </div>
      </div>
    </DashboardRangeProvider>
  )
}
