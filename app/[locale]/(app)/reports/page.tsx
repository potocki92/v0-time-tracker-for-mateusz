import { Suspense } from 'react'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { QUERY_CONFIG } from '@/lib/query'
import { ReportsContent, ReportsContentBoundary, ReportsSkeleton } from '@/features/reports'
import { getReportsDatasetServer, reportsQueryOptions } from '@/features/reports/server'
import { fetchWindowOf, rangeOf, todayKey, type ReportFilters } from '@/features/reports/domain'
import { toAppLocale } from '@/i18n/config'
import { workspaceMetadata } from '@/lib/seo/workspace-metadata'
import { parseReportFiltersFromSearchParams } from './searchParams'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return workspaceMetadata(toAppLocale(locale), 'reports')
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

/**
 * Default export jest SYNCHRONICZNY celowo — `await` w default exporcie
 * wstrzymywalby caly payload RSC do czasu powrotu zapytan Supabase,
 * przez co `<Suspense>` ponizej nie mialby czego zawiesic.
 */
export default function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <ReportsContentBoundary>
      <Suspense fallback={<ReportsSkeleton />}>
        <ReportsData searchParams={searchParams} />
      </Suspense>
    </ReportsContentBoundary>
  )
}

/**
 * Prefetch trafia w DOKLADNIE ten klucz, ktory zlozy klient.
 *
 * Filtry zyja w query params, wiec serwer czyta te same parametry co `nuqs`
 * i liczy z nich to samo okno. `today` jedzie propsem: gdyby klient liczyl
 * je sam, roznica stref albo polnoc miedzy renderami dalaby inny zakres,
 * inny klucz i drugie pobranie tych samych danych.
 */
async function ReportsData({ searchParams }: { searchParams: SearchParams }) {
  const today = todayKey()
  const filters: ReportFilters = parseReportFiltersFromSearchParams(await searchParams)
  const window = fetchWindowOf(rangeOf(filters, today), filters.compare)

  const queryClient = new QueryClient({
    defaultOptions: { queries: QUERY_CONFIG.reports },
  })

  const options = reportsQueryOptions({
    window,
    clientId: filters.clientId,
    projectId: filters.projectId,
  })

  await queryClient.prefetchQuery({
    queryKey: options.queryKey,
    queryFn: () =>
      getReportsDatasetServer({
        window,
        clientId: filters.clientId,
        projectId: filters.projectId,
      }),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReportsContent today={today} />
    </HydrationBoundary>
  )
}
