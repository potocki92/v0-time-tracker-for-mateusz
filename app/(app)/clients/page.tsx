import { Suspense } from 'react'
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query'
import { QUERY_KEYS, QUERY_CONFIG } from '@/lib/query'
import { ClientsContent, ClientsContentBoundary, ClientsSkeleton } from '@/features/clients'
import { getClientsDataServer } from '@/features/clients/server'

/**
 * Default export jest SYNCHRONICZNY celowo — `await prefetchQuery` w default
 * exporcie wstrzymywal caly payload RSC do czasu powrotu zapytan Supabase,
 * przez co `<Suspense>` ponizej nigdy nie mial czego zawiesic.
 */
export default function ClientsPage() {
  return (
    <ClientsContentBoundary>
      <Suspense fallback={<ClientsSkeleton />}>
        <ClientsData />
      </Suspense>
    </ClientsContentBoundary>
  )
}

async function ClientsData() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: QUERY_CONFIG.clients },
  })

  await queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.clientsData(),
    queryFn: getClientsDataServer,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClientsContent />
    </HydrationBoundary>
  )
}
