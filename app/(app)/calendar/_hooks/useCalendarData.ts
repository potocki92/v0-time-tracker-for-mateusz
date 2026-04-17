'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { getCalendarData } from '../_services/calendar.service'
import { QUERY_KEYS, QUERY_CONFIG } from '@/lib/query'
import type { CalendarData } from '../_domain/calendar.types'

/**
 * Główny hook kalendarza — używa useSuspenseQuery (zgodnie z pattern'em dashboardu).
 * `data` jest zawsze zdefiniowane, loading obsługuje Suspense w page.tsx.
 */
export function useCalendarData() {
  return useSuspenseQuery<CalendarData>({
    queryKey: QUERY_KEYS.calendar(),
    queryFn: getCalendarData,
    ...QUERY_CONFIG.calendar,
  })
}
