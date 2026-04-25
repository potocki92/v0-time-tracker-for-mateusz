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
 */
export function DashboardSkeleton() {
  return (
    <div
      className="min-h-screen bg-black text-white"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto w-full max-w-2xl space-y-4 px-3 pb-28 pt-2 sm:px-4">
        <HeaderSkeleton />
        <KpiSkeleton />
        <StatsSkeleton />
        <ChartSkeleton />
        <InvoicesSkeleton />
      </div>
    </div>
  )
}
