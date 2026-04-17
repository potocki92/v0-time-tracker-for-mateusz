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
 * Dashboard jest rozbity na niezależne sekcje, każda z własnym <Suspense>.
 *
 * Dziś wszystkie sekcje współdzielą jeden queryKey (useDashboardData),
 * więc React Query dedupuje fetch — ale per-section Suspense daje:
 *   (a) izolację re-suspense przy invalidacji cache,
 *   (b) gotowość na przyszły split zapytań bez zmian tutaj,
 *   (c) mniejsze zakresy re-renderów.
 *
 * Skeleton per sekcja ma stabilną wysokość (content-visibility + intrinsic-size),
 * co eliminuje CLS po zhydraowaniu danych.
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

        <Suspense fallback={<StatsSkeleton />}>
          <StatsSection />
        </Suspense>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Suspense fallback={<ChartSkeleton />}>
              <ChartSection />
            </Suspense>
          </div>

          <Suspense fallback={<InvoicesSkeleton />}>
            <InvoicesSection />
          </Suspense>
        </div>
      </div>
    </DashboardRangeProvider>
  )
}
