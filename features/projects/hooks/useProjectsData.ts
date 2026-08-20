'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { QUERY_CONFIG, QUERY_KEYS, fetchJson } from '@/lib/query'
import type { ProjectsData } from '../types/projects.types'

/**
 * Główny hook modułu — useSuspenseQuery → `data` zawsze zdefiniowane.
 * Suspense fallback jest ustawiany w page.tsx (<ProjectsSkeleton />).
 */
export function useProjectsData() {
  return useSuspenseQuery<ProjectsData>({
    queryKey: QUERY_KEYS.projectsData(),
    queryFn: () => fetchJson<ProjectsData>('/api/projects'),
    ...QUERY_CONFIG.projects,
  })
}
