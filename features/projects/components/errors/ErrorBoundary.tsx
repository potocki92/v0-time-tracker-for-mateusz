'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { captureError } from '@/lib/monitoring/sentry'
import { DefaultFallback } from './ErrorBoundary.fallback'
import type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
  FallbackComponent,
} from './ErrorBoundary.types'

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static readonly displayName = 'ProjectsErrorBoundary'

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, componentStack: null }
    this.resetError = this.resetError.bind(this)
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    const { onError, sectionName } = this.props
    this.setState({ componentStack: info.componentStack ?? null })

    captureError(error, sectionName ?? 'unknown', {
      extra: { componentStack: info.componentStack },
    })

    onError?.(error, info)
  }

  resetError(): void {
    this.setState({ hasError: false, error: null, componentStack: null })
  }

  override render(): ReactNode {
    const { hasError, error, componentStack } = this.state
    const { children, fallback } = this.props

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
