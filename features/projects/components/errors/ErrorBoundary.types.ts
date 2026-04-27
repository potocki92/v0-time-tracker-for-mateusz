import type { ComponentType, ErrorInfo, ReactNode } from 'react'

export interface ErrorBoundaryFallbackProps {
  error: Error
  resetError: () => void
  componentStack: string | null
}

export type FallbackComponent = ComponentType<ErrorBoundaryFallbackProps>

export interface ErrorBoundaryProps {
  fallback?: FallbackComponent | ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
  children: ReactNode
  sectionName?: string
}

export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  componentStack: string | null
}

export interface SectionBoundaryProps {
  children: ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
}
