import { Suspense } from 'react'
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/query/queryKeys'
import { QUERY_CONFIG } from '@/lib/query/queryConfig'
import { CalendarContent, CalendarContentBoundary, CalendarSkeleton } from '@/features/calendar'
import { getCalendarDataServer } from '@/features/calendar/server'
import { toAppLocale } from '@/i18n/config'
import { workspaceMetadata } from '@/lib/seo/workspace-metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return workspaceMetadata(toAppLocale(locale), 'calendar')
}

/**
 * Default export jest SYNCHRONICZNY celowo — `await prefetchQuery` w default
 * exporcie wstrzymywal caly payload RSC do czasu powrotu zapytan Supabase,
 * przez co `<Suspense>` ponizej nigdy nie mial czego zawiesic.
 */
export default function CalendarPage() {
  return (
    <CalendarContentBoundary>
      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarData />
      </Suspense>
    </CalendarContentBoundary>
  )
}

async function CalendarData() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: QUERY_CONFIG.calendar },
  })

  await queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.calendar(),
    queryFn: getCalendarDataServer,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CalendarContent />
    </HydrationBoundary>
  )
}
