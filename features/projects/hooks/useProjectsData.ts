'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { QUERY_CONFIG, QUERY_KEYS } from '@/lib/query'
import { getProjectsData } from '../services/projects.service'
import type { ProjectsData } from '../types/projects.types'

/**
 * Główny hook modułu — useSuspenseQuery → `data` zawsze zdefiniowane.
 * Suspense fallback jest ustawiany w page.tsx (<ProjectsSkeleton />).
 */
export function useProjectsData() {
  return useSuspenseQuery<ProjectsData>({
    queryKey: QUERY_KEYS.projectsData(),
    queryFn: getProjectsData,
    ...QUERY_CONFIG.projects,
  })
}
