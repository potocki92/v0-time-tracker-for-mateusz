import {
  HeaderSkeleton,
  KpiSkeleton,
  StatsSkeleton,
  ChartSkeleton,
  InvoicesSkeleton,
} from './skeletons'

/**
 * Page-level fallback dla <Suspense> w page.tsx — pokazywany tylko
 * gdy żadne dane nie są jeszcze w cache (rzadki przypadek — prefetch
 * serwerowy przekazuje je przez HydrationBoundary).
 *
 * Zbudowany z tych samych sekcyjnych skeletonów, których używa
 * DashboardContent → spójny look, jedna ścieżka utrzymania.
 */
export function DashboardSkeleton() {
  return (
    <div
      className="container space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-6"
      aria-busy="true"
      aria-live="polite"
    >
      <HeaderSkeleton />
      <KpiSkeleton />
      <StatsSkeleton />
      <div className="grid gap-3 sm:gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <ChartSkeleton />
        </div>
        <div className="min-w-0">
          <InvoicesSkeleton />
        </div>
      </div>
    </div>
  )
}
