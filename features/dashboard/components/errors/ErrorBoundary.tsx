"use client"

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { DefaultFallback } from './ErrorBoundary.fallback'
import { captureError } from '@/lib/monitoring/sentry'
import type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
  FallbackComponent,
} from './ErrorBoundary.types'

/**
 * ErrorBoundary — izoluje błędy renderowania per sekcja.
 *
 * React wymaga class component dla error boundaries.
 * Hooki nie mogą łapać błędów renderowania.
 *
 * @example
 * <ErrorBoundary sectionName="Chart" onError={customCallback}>
 *   <EarningsChart />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static readonly displayName = 'ErrorBoundary'

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state      = { hasError: false, error: null, componentStack: null }
    this.resetError = this.resetError.bind(this)
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    const { onError, sectionName } = this.props

    this.setState({ componentStack: info.componentStack ?? null })

    // #11 — Sentry zamiast console.error.
    // Każdy błąd jest tagowany nazwą sekcji → łatwe filtrowanie w Sentry UI.
    // componentStack trafia do `extra` — widoczny w zakładce "Additional Data".
    captureError(error, sectionName ?? 'unknown', {
      extra: { componentStack: info.componentStack },
    })

    // Callback dla rodzica (np. dodatkowy custom logger) — zachowany bez zmian.
    onError?.(error, info)
  }

  resetError(): void {
    this.setState({ hasError: false, error: null, componentStack: null })
  }

  override render(): ReactNode {
    const { hasError, error, componentStack } = this.state
    const { children, fallback }              = this.props

    if (!hasError || !error) return children

    if (typeof fallback === 'function') {
      const Fallback = fallback as FallbackComponent
      return <Fallback error={error} resetError={this.resetError} componentStack={componentStack} />
    }

    if (fallback !== undefined) return fallback

    return (
      <DefaultFallback
        error={error}
        resetError={this.resetError}
        componentStack={componentStack}
      />
    )
  }
}