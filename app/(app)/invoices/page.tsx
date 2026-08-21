import { Suspense } from 'react'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { QUERY_CONFIG } from '@/lib/query'
import { InvoicesContent } from '@/features/invoices'
import { INVOICES_MANAGER_QUERY_KEY } from '@/features/invoices/domain'
import { getInvoicesDataServer } from '@/features/invoices/server'
import InvoicesSkeleton from './loading'
import { workspaceMetadata } from '@/lib/workspace/sections'

export const metadata = workspaceMetadata('invoices')

/**
 * Default export jest SYNCHRONICZNY celowo — `await prefetchQuery` w default
 * exporcie wstrzymywal caly payload RSC do czasu powrotu zapytan Supabase,
 * przez co `<Suspense>` ponizej nigdy nie mial czego zawiesic.
 */
export default function InvoicesPage() {
  return (
    <Suspense fallback={<InvoicesSkeleton />}>
      <InvoicesData />
    </Suspense>
  )
}

async function InvoicesData() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: QUERY_CONFIG.invoices },
  })

  await queryClient.prefetchQuery({
    queryKey: INVOICES_MANAGER_QUERY_KEY,
    queryFn: getInvoicesDataServer,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InvoicesContent />
    </HydrationBoundary>
  )
}
