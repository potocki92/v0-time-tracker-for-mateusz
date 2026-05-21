'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { QUERY_CLIENT_DEFAULTS } from '@/lib/query/queryConfig'

const ReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then((mod) => mod.ReactQueryDevtools),
  { ssr: false },
)

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            ...QUERY_CLIENT_DEFAULTS.queries,
            retry: (failureCount, error: any) => {
              // Nie retry-uj 4xx (błędy klienta)
              if (error?.status >= 400 && error?.status < 500) return false
              return failureCount < 2
            },
          mutations: QUERY_CLIENT_DEFAULTS.mutations,
        },
      }),
  )

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
      </QueryClientProvider>
    </NuqsAdapter>
  )
}
