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
      <div className="container space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-6">
        <Suspense fallback={<HeaderSkeleton />}>
          <HeaderSection />
        </Suspense>

        <Suspense fallback={<KpiSkeleton />}>
          <KpiSection />
        </Suspense>

        {/*
         * gap-4 identyczny jak w KpiSection — wtedy 8/12 (chart) ma dokładnie
         * taką samą szerokość jak 8/12 (EarningsCard) nad nim. Różnica gapów
         * powodowała ~8px rozjazd, przez co wykres wyglądał „szerzej".
         * Mobile: stack 1-col z gap-3; lg+: bento 4/8.
         */}
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-12">
          <div className="min-w-0 space-y-3 sm:space-y-4 lg:col-span-4">
            <Suspense fallback={<StatsSkeleton />}>
              <StatsSection />
            </Suspense>
            <Suspense fallback={<InvoicesSkeleton />}>
              <InvoicesSection />
            </Suspense>
          </div>

          <div className="min-w-0 lg:col-span-8">
            <Suspense fallback={<ChartSkeleton />}>
              <ChartSection />
            </Suspense>
          </div>
        </div>
      </div>
    </DashboardRangeProvider>
  )
}
