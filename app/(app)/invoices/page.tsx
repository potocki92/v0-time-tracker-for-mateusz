import { Suspense } from 'react'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { QUERY_CONFIG } from '@/lib/query'
import { InvoicesContent } from './_components'
import InvoicesSkeleton from './loading'
import { INVOICES_MANAGER_QUERY_KEY } from './_domain'
import { getInvoicesDataServer } from './_services/invoices.service.server'

export default async function InvoicesPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: QUERY_CONFIG.invoices },
  })

  await queryClient.prefetchQuery({
    queryKey: INVOICES_MANAGER_QUERY_KEY,
    queryFn: getInvoicesDataServer,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<InvoicesSkeleton />}>
        <InvoicesContent />
      </Suspense>
    </HydrationBoundary>
  )
}
