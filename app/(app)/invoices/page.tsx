import { Suspense } from 'react'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { QUERY_CONFIG } from '@/lib/query'
import { InvoicesContent } from '@/features/invoices/components'
import { INVOICES_MANAGER_QUERY_KEY } from '@/features/invoices/domain'
import { getInvoicesDataServer } from '@/features/invoices/services/server/invoices.service.server'
import InvoicesSkeleton from './loading'

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
