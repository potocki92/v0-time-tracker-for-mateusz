'use client'

import { Suspense, type ReactNode } from 'react'
import { TripsSection } from '@/features/trips'
import {
  ActivitySection,
  DashboardRangeProvider,
  EarningsSection,
  EffectiveRateSection,
  Footer,
  GoalSection,
  HeaderSection,
  HoursSection,
  InvoicesSection,
  ProjectsSection,
  QuarterlySummarySection,
  QuickActionsSection,
  SectionHeader,
  UpcomingSection,
  WeeklyGlanceSection,
  WeeklySummarySection,
} from './sections'
import {
  ChartSkeleton,
  HeaderSkeleton,
  InvoicesSkeleton,
  KpiSkeleton,
  StatsSkeleton,
} from './skeletons'

type DashboardSectionProps = {
  fallback: ReactNode
  children: ReactNode
}

function DashboardSection({ fallback, children }: DashboardSectionProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>
}

export function DashboardContent() {
  return (
    <DashboardRangeProvider>
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto w-full space-y-4 px-3 pb-24 pt-2 sm:px-4 md:pb-10 md:pt-3">
          <DashboardSection fallback={<HeaderSkeleton />}>
            <HeaderSection />
          </DashboardSection>

          <TripsSection />

          <DashboardSection fallback={<KpiSkeleton />}>
            <EarningsSection />
          </DashboardSection>

          <DashboardSection fallback={<KpiSkeleton />}>
            <GoalSection />
          </DashboardSection>

          <DashboardSection fallback={<ChartSkeleton />}>
            <HoursSection />
          </DashboardSection>

          <DashboardSection fallback={<StatsSkeleton />}>
            <EffectiveRateSection />
          </DashboardSection>

          <DashboardSection fallback={<StatsSkeleton />}>
            <ActivitySection />
          </DashboardSection>

          <SectionHeader label="Harmonogram i rozliczenia" />

          <DashboardSection fallback={<InvoicesSkeleton />}>
            <ProjectsSection />
          </DashboardSection>

          <DashboardSection fallback={<InvoicesSkeleton />}>
            <InvoicesSection />
          </DashboardSection>

          <DashboardSection fallback={<InvoicesSkeleton />}>
            <QuarterlySummarySection />
          </DashboardSection>

          <DashboardSection fallback={<InvoicesSkeleton />}>
            <WeeklySummarySection />
          </DashboardSection>

          <SectionHeader label="Wkrótce" />

          <DashboardSection fallback={<InvoicesSkeleton />}>
            <UpcomingSection />
          </DashboardSection>

          <QuickActionsSection />

          <DashboardSection fallback={<ChartSkeleton />}>
            <WeeklyGlanceSection />
          </DashboardSection>

          <Footer />
        </div>
      </main>
    </DashboardRangeProvider>
  )
}
