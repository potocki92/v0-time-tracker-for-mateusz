'use client'

import { Suspense } from 'react'
import {
  DashboardRangeProvider,
  HeaderSection,
  KpiSection,
  StatsSection,
  ChartSection,
  InvoicesSection,
} from './sections'
import {
  HeaderSkeleton,
  KpiSkeleton,
  StatsSkeleton,
  ChartSkeleton,
  InvoicesSkeleton,
} from './skeletons'

/**
 * Bento layout (12 kolumn, lg+):
 *
 *   ┌─────────────────────────────┬──────────┐
 *   │  EarningsCard  (8/12 hero)  │ Goal 4/12│
 *   ├───────────────┬─────────────┴──────────┤
 *   │  Stats 4/12   │     Chart 8/12          │
 *   │               ├─────────────────────────┤
 *   │  Invoices 4/12│                         │
 *   └───────────────┴─────────────────────────┘
 *
 * Hierarchia: jeden hero (EarningsCard), cel jako radial w prawym górnym
 * rogu (szybka odpowiedź na „jak daleko do targetu"), stats i faktury
 * w lewej kolumnie 4/12, chart dominuje prawą stroną jako 8/12.
 *
 * Mobile: wszystko 1-kolumnowe (sekcje same decydują o swoim
 * wewnętrznym gridzie), kolejność: Header → KPI → Stats → Chart → Invoices.
 */
export function DashboardContent() {
  return (
    <DashboardRangeProvider>
      <div className="container space-y-6 px-4 py-6">
        <Suspense fallback={<HeaderSkeleton />}>
          <HeaderSection />
        </Suspense>

        <Suspense fallback={<KpiSkeleton />}>
          <KpiSection />
        </Suspense>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-4">
            <Suspense fallback={<StatsSkeleton />}>
              <StatsSection />
            </Suspense>
            <Suspense fallback={<InvoicesSkeleton />}>
              <InvoicesSection />
            </Suspense>
          </div>

          <div className="lg:col-span-8">
            <Suspense fallback={<ChartSkeleton />}>
              <ChartSection />
            </Suspense>
          </div>
        </div>
      </div>
    </DashboardRangeProvider>
  )
}
