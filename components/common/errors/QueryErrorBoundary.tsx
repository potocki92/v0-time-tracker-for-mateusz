'use client'

import type { ReactNode } from 'react'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from './ErrorBoundary'
import type { ErrorBoundaryProps } from './ErrorBoundary.types'

type Props = Omit<ErrorBoundaryProps, 'children'> & {
  children: ReactNode
}

/**
 * Wrapper który łączy Twój ErrorBoundary z mechanizmem reset React Query.
 *
 * Dlaczego to potrzebne:
 *  • Gdy queryFn rzuci błąd w Suspense, Twój ErrorBoundary go łapie.
 *  • resetError() w Twoim ErrorBoundary tylko czyści lokalny state.
 *  • React Query wciąż pamięta błąd i rzuci go ponownie przy następnym renderze.
 *  • QueryErrorResetBoundary.reset() czyści błędy w cache query,
 *    więc query może zostać spróbowane ponownie.
 *
 * Użycie: identyczne jak <ErrorBoundary>, ale dla sekcji używających
 * useSuspenseQuery / useQuery które mogą rzucać błędy w Suspense.
 */
export function QueryErrorBoundary({ children, sectionName, onError, fallback }: Props) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          sectionName={sectionName}
          onError={(error, info) => {
            reset()          // ⬅ czyść też cache query
            onError?.(error, info)
          }}
          fallback={fallback}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
