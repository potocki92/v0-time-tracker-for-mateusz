import { Component, type ErrorInfo, type ReactNode } from 'react'
import { DefaultFallback } from './ErrorBoundary.fallback'
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
 * <ErrorBoundary sectionName="Chart" onError={Sentry.captureException}>
 *   <EarningsChart />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static readonly displayName = 'ErrorBoundary'

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state  = { hasError: false, error: null, componentStack: null }
    this.resetError = this.resetError.bind(this)
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const { onError, sectionName } = this.props

    this.setState({ componentStack: info.componentStack ?? null })

    // Podmień console.error na Sentry.captureException w produkcji
    console.error(
      `[ErrorBoundary${sectionName ? ` :: ${sectionName}` : ''}]`,
      error,
      info.componentStack,
    )

    onError?.(error, info)
  }

  resetError(): void {
    this.setState({ hasError: false, error: null, componentStack: null })
  }

  render(): ReactNode {
    const { hasError, error, componentStack } = this.state
    const { children, fallback }              = this.props

    if (!hasError || !error) return children

    // Przekazany komponent jako fallback
    if (typeof fallback === 'function') {
      const Fallback = fallback as FallbackComponent
      return <Fallback error={error} resetError={this.resetError} componentStack={componentStack} />
    }

    // Przekazany ReactNode jako fallback
    if (fallback !== undefined) return fallback

    // Domyślny fallback
    return (
      <DefaultFallback
        error={error}
        resetError={this.resetError}
        componentStack={componentStack}
      />
    )
  }
}