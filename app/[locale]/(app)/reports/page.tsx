import { Suspense } from 'react'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { QUERY_CONFIG, QUERY_KEYS } from '@/lib/query'
import { ReportsContent, ReportsSkeleton } from '@/features/reports'
// Wejscie serwerowe, nie kliencki barrel `@/features/dashboard` — dzieki temu
// `DashboardContent` i reszta klienckiego dashboardu nie wpada do bundle'a raportow.
import { getDashboardDataServer } from '@/features/dashboard/server'
import { toAppLocale } from '@/i18n/config'
import { workspaceMetadata } from '@/lib/seo/workspace-metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return workspaceMetadata(toAppLocale(locale), 'reports')
}

/**
 * Default export jest SYNCHRONICZNY celowo — `await prefetchQuery` w default
 * exporcie wstrzymywal caly payload RSC do czasu powrotu zapytan Supabase,
 * przez co `<Suspense>` ponizej nigdy nie mial czego zawiesic.
 */
export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportsSkeleton />}>
      <ReportsData />
    </Suspense>
  )
}

// Raporty czytaja ten sam zbior co dashboard (`useDashboardData`), wiec
// prefetchujemy ten sam klucz i konfiguracje.
async function ReportsData() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: QUERY_CONFIG.dashboard },
  })

  await queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.dashboard(),
    queryFn: getDashboardDataServer,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReportsContent />
    </HydrationBoundary>
  )
}
