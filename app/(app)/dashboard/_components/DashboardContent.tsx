'use client'

import { Suspense } from 'react'
import { DashboardRangeProvider } from './sections'
import {
  HeaderSection,
  EarningsSection,
  StatsSection,
  HeatmapSection,
  QuickActionsSection,
  InvoicesSection,
} from './sections'
import {
  HeaderSkeleton,
  KpiSkeleton,
  StatsSkeleton,
  ChartSkeleton,
  InvoicesSkeleton,
} from './skeletons'
import { BottomNav } from './navigation/BottomNav'

/**
 * Linear-style dark dashboard, mobile-first, single column.
 * Sekcje (od góry):
 *   1. TopBar (Dashboard + bell + green play timer)
 *   2. Earnings overview (area chart + circular progress goal)
 *   3. Stats row (hours / clients / absences)
 *   4. Hours heatmap (GitHub style)
 *   5. Quick actions (2-col grid)
 *   6. Invoices list (status pills)
 *   7. Bottom nav (sticky)
 *
 * Tła i bordery są na sztywno czarne — pełen Linear-look niezależnie od motywu.
 */
export function DashboardContent() {
  return (
    <DashboardRangeProvider>
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto w-full max-w-2xl space-y-4 px-3 pb-28 pt-2 sm:px-4">
          <Suspense fallback={<HeaderSkeleton />}>
            <HeaderSection />
          </Suspense>

          <Suspense fallback={<KpiSkeleton />}>
            <EarningsSection />
          </Suspense>

          <Suspense fallback={<StatsSkeleton />}>
            <StatsSection />
          </Suspense>

          <Suspense fallback={<ChartSkeleton />}>
            <HeatmapSection />
          </Suspense>

          <QuickActionsSection />

          <Suspense fallback={<InvoicesSkeleton />}>
            <InvoicesSection />
          </Suspense>
        </div>
        <BottomNav />
      </div>
    </DashboardRangeProvider>
  )
}
