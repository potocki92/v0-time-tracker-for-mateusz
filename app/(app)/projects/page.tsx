import { Suspense } from 'react'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { QUERY_CONFIG, QUERY_KEYS } from '@/lib/query'
import { ProjectsContent, ProjectsContentBoundary, ProjectsSkeleton } from '@/features/projects'
import { getProjectsDataServer } from '@/features/projects/server'

/**
 * Default export jest SYNCHRONICZNY celowo — `await prefetchQuery` w default
 * exporcie wstrzymywal caly payload RSC do czasu powrotu zapytan Supabase,
 * przez co `<Suspense>` ponizej nigdy nie mial czego zawiesic.
 */
export default function ProjectsPage() {
  return (
    <ProjectsContentBoundary>
      <Suspense fallback={<ProjectsSkeleton />}>
        <ProjectsData />
      </Suspense>
    </ProjectsContentBoundary>
  )
}

async function ProjectsData() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: QUERY_CONFIG.projects },
  })

  await queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.projectsData(),
    queryFn: getProjectsDataServer,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectsContent />
    </HydrationBoundary>
  )
}
