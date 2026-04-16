import { Suspense } from 'react'
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query'
import { QUERY_KEYS, QUERY_CONFIG } from '@/lib/query'
import { ClientsContent } from './_components/ClientsContent'
import { ClientsSkeleton } from './_components/ClientsSkeleton'
import { ClientsContentBoundary } from './_components/errors'
import { getClientsDataServer } from './_services/clients.service.server'

// Server Component — prefetch na serwerze, user dostaje dane od razu po hydracji.
export default async function ClientsPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: QUERY_CONFIG.clients },
  })

  await queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.clientsData(),
    queryFn:  getClientsDataServer,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClientsContentBoundary>
        <Suspense fallback={<ClientsSkeleton />}>
          <ClientsContent />
        </Suspense>
      </ClientsContentBoundary>
    </HydrationBoundary>
  )
}
