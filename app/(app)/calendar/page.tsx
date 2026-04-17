import { Suspense } from 'react'
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/query/queryKeys'
import { QUERY_CONFIG } from '@/lib/query/queryConfig'
import { getCalendarDataServer } from './_services/calendar.service.server'
import { CalendarContent } from './_components/CalendarContent'
import { CalendarSkeleton } from './_components/CalendarSkeleton'
import { CalendarContentBoundary } from './_components/errors'

// Server Component — prefetch w HydrationBoundary, analogicznie do dashboardu
export default async function CalendarPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: QUERY_CONFIG.calendar },
  })

  await queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.calendar(),
    queryFn: getCalendarDataServer,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CalendarContentBoundary>
        <Suspense fallback={<CalendarSkeleton />}>
          <CalendarContent />
        </Suspense>
      </CalendarContentBoundary>
    </HydrationBoundary>
  )
}
