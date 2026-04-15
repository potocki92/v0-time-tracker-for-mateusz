import { Suspense } from 'react'
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query'
import { DashboardContent } from './_components/DashboardContent'
import { DashboardSkeleton } from './_components/DashboardSkeleton'
// import { DashboardErrorBoundary } from './_components/DashboardErrorBoundary'
import { QUERY_KEYS } from '@/lib/query/queryKeys'
import { QUERY_CONFIG } from '@/lib/query/queryConfig'
import { getDashboardData } from './_services/dashboard.service'
import { getDashboardDataServer } from './_services/dashboard.service.server'
import { DashboardContentBoundary } from './_components/errors'

// Server Component — bez 'use client'
export default async function DashboardPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: QUERY_CONFIG.dashboard },
  })

  // Prefetch na serwerze — user dostanie dane od razu
  await queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.dashboard(),
    queryFn: getDashboardDataServer,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardContentBoundary>
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </DashboardContentBoundary>
    </HydrationBoundary>
  )
}
