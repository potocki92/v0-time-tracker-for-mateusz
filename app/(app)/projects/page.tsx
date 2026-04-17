import { Suspense } from 'react'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { QUERY_CONFIG, QUERY_KEYS } from '@/lib/query'
import { ProjectsContent } from './_components/ProjectsContent'
import { ProjectsSkeleton } from './_components/ProjectsSkeleton'
import { ProjectsContentBoundary } from './_components/errors'
import { getProjectsDataServer } from './_services/projects.service.server'

// Server Component — bez 'use client'
export default async function ProjectsPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: QUERY_CONFIG.projects },
  })

  // Prefetch na serwerze — user dostanie dane od razu
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
