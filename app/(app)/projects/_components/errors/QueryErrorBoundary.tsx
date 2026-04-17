'use client'

import type { ReactNode } from 'react'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from './ErrorBoundary'
import type { ErrorBoundaryProps } from './ErrorBoundary.types'

type Props = Omit<ErrorBoundaryProps, 'children'> & {
  children: ReactNode
}

export function QueryErrorBoundary({ children, sectionName, onError, fallback }: Props) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          sectionName={sectionName}
          onError={(error, info) => {
            reset()
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
