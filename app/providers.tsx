'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime:    1000 * 60 * 30,
            retry: (failureCount, error: any) => {
              // Nie retry-uj 4xx (błędy klienta)
              if (error?.status >= 400 && error?.status < 500) return false
              return failureCount < 2
            },
            refetchOnWindowFocus: 'always',
            refetchOnReconnect:   'always',
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  )
}
