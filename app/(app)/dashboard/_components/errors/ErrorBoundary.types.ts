import type { ComponentType, ErrorInfo, ReactNode } from 'react'

// ── Fallback ──────────────────────────────────────────────────────────────────

export interface ErrorBoundaryFallbackProps {
  /** Złapany błąd */
  error: Error
  /** Reset stanu — ponowne renderowanie dzieci */
  resetError: () => void
  /** Stack trace komponentu (dev only) */
  componentStack: string | null
}

/** Komponent wyświetlany zamiast dzieci gdy wystąpi błąd */
export type FallbackComponent = ComponentType<ErrorBoundaryFallbackProps>

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ErrorBoundaryProps {
  /** Komponent lub ReactNode wyświetlany przy błędzie.
   *  Gdy undefined — użyty jest DefaultFallback. */
  fallback?: FallbackComponent | ReactNode
  /** Callback wywoływany przy każdym złapanym błędzie.
   *  Użyj do integracji z Sentry / Datadog. */
  onError?: (error: Error, info: ErrorInfo) => void
  /** Dzieci objęte granicą błędu */
  children: ReactNode
  /** Nazwa sekcji — pojawia się w logach konsoli */
  sectionName?: string
}

// ── State ─────────────────────────────────────────────────────────────────────

export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  componentStack: string | null
}

// ── Section wrappers ──────────────────────────────────────────────────────────

export interface SectionBoundaryProps {
  children: ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
}