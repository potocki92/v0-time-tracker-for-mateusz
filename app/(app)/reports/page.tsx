import { Suspense } from 'react'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { QUERY_CONFIG, QUERY_KEYS } from '@/lib/query'
import { ReportsContent, ReportsSkeleton } from '@/features/reports'
// Wejscie serwerowe, nie kliencki barrel `@/features/dashboard` — dzieki temu
// `DashboardContent` i reszta klienckiego dashboardu nie wpada do bundle'a raportow.
import { getDashboardDataServer } from '@/features/dashboard/server'

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
