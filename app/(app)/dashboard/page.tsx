import { Suspense } from 'react'
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query'
import { DashboardContent, DashboardContentBoundary, DashboardSkeleton } from '@/features/dashboard'
import { getDashboardDataServer } from '@/features/dashboard/server'
import { QUERY_KEYS } from '@/lib/query/queryKeys'
import { QUERY_CONFIG } from '@/lib/query/queryConfig'
import { workspaceMetadata } from '@/lib/workspace/sections'

export const metadata = workspaceMetadata('dashboard')

/**
 * Default export jest SYNCHRONICZNY celowo.
 *
 * Wczesniej `await prefetchQuery` stal w default exporcie, wiec Next nie mogl
 * wyslac ani bajta payloadu RSC, dopoki nie wrocilo najwolniejsze z 5 zapytan
 * Supabase. `<Suspense>` ponizej byl martwym kodem — promise byl juz rozwiazany,
 * zanim React doszedl do renderu.
 *
 * Teraz powloka segmentu leci natychmiast, a dane dostreamowuja sie osobno.
 */
export default function DashboardPage() {
  return (
    <DashboardContentBoundary>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardData />
      </Suspense>
    </DashboardContentBoundary>
  )
}

async function DashboardData() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: QUERY_CONFIG.dashboard },
  })

  await queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.dashboard(),
    queryFn: getDashboardDataServer,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardContent />
    </HydrationBoundary>
  )
}
