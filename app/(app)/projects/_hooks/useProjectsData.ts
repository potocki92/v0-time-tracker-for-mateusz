'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { QUERY_CONFIG, QUERY_KEYS } from '@/lib/query'
import { getProjectsData } from '../_services/projects.service'
import type { ProjectsData } from '../_domain/projects.types'

/**
 * Główny hook modułu projektów.
 * Używa useSuspenseQuery → `data` zawsze zdefiniowane.
 * Suspense obsługuje loading w page.tsx (<ProjectsSkeleton />).
 */
export function useProjectsData() {
  return useSuspenseQuery<ProjectsData>({
    queryKey: QUERY_KEYS.projectsData(),
    queryFn: getProjectsData,
    ...QUERY_CONFIG.projects,
  })
}
