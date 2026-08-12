import { Suspense } from 'react'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { QUERY_CONFIG, QUERY_KEYS } from '@/lib/query'
import { ReportsContent, ReportsSkeleton } from '@/features/reports'
// Import prosto z serwisu, nie przez barrel `@/features/dashboard` — barrel
// re-eksportuje `DashboardContent`, przez co cały kliencki dashboard wpadłby
// do bundle'a raportów.
import { getDashboardDataServer } from '@/features/dashboard/services/dashboard.service.server'

// Server Component — raporty czytają ten sam zbiór co dashboard
// (`useDashboardData`), więc prefetchujemy go na serwerze zamiast czekać
// na pełny fetch dopiero po hydracji.
export default async function ReportsPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: QUERY_CONFIG.dashboard },
  })

  await queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.dashboard(),
    queryFn: getDashboardDataServer,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ReportsSkeleton />}>
        <ReportsContent />
      </Suspense>
    </HydrationBoundary>
  )
}
