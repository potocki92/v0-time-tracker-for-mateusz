import { Suspense } from 'react'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { QUERY_CONFIG, QUERY_KEYS } from '@/lib/query'
import {
  ProjectsContent,
  ProjectsSkeleton,
  getProjectsDataServer,
} from '@/features/projects'
import { ProjectsContentBoundary } from './_components/errors'

// Server Component — bez 'use client'.
// Prefetch po stronie serwera + hydracja React Query → user dostaje
// dane od razu, a sekcje renderują się synchronicznie po hydracji.
export default async function ProjectsPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: QUERY_CONFIG.projects },
  })

  await queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.projectsData(),
    queryFn: getProjectsDataServer,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectsContentBoundary>
        <Suspense fallback={<ProjectsSkeleton />}>
          <ProjectsContent />
        </Suspense>
      </ProjectsContentBoundary>
    </HydrationBoundary>
  )
}
