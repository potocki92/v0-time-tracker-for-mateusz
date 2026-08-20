import * as Sentry from '@sentry/nextjs'

// ── Types ─────────────────────────────────────────────────────────────────────

interface CaptureOptions {
  tags?:  Record<string, string>
  extra?: Record<string, unknown>
  level?: Sentry.SeverityLevel
}

// ── Error capture ─────────────────────────────────────────────────────────────

export function captureError(
  error: unknown,
  section: string,
  options: CaptureOptions = {},
): void {
  Sentry.withScope((scope) => {
    scope.setTag('section', section)
    scope.setLevel(options.level ?? 'error')

    if (options.tags) {
      Object.entries(options.tags).forEach(([k, v]) => scope.setTag(k, v))
    }

    if (options.extra) {
      Object.entries(options.extra).forEach(([k, v]) => scope.setExtra(k, v))
    }

    Sentry.captureException(error)
  })
}

// ── Ignored errors ────────────────────────────────────────────────────────────

export const SENTRY_IGNORED_ERRORS = [
  'NetworkError',
  'Failed to fetch',
  'Load failed',
  'Network request failed',
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications',
  'Non-Error promise rejection captured',
  'Rate limit exceeded',
] as const

// ── beforeSend filter ─────────────────────────────────────────────────────────

function sanitizeUrl(url: string): string {
  return url.replace(
    /([?&])(token|key|secret|auth)=[^&]*/gi,
    '$1$2=[REDACTED]',
  )
}

function isExtensionFrame(filename?: string): boolean {
  if (!filename) return false
  return filename.includes('extension://')
}

export function sentryBeforeSend(
  event: Sentry.ErrorEvent,
  _hint: Sentry.EventHint,
): Sentry.ErrorEvent | null {
  // Drop events when offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return null
  }

  // Drop events from browser extensions
  const frames = event.exception?.values?.[0]?.stacktrace?.frames
  if (frames && frames.some((f) => isExtensionFrame(f.filename))) {
    return null
  }

  // Sanitize breadcrumb URLs — build a new event object (breadcrumbs is readonly)
  const breadcrumbs = event.breadcrumbs
  if (!breadcrumbs || breadcrumbs.length === 0) {
    return event
  }

  const sanitizedBreadcrumbs = breadcrumbs.map((bc) => {
    const data = bc.data as Record<string, unknown> | null | undefined
    if (!data) return bc

    const url = data.url
    if (typeof url !== 'string') return bc

    return {
      ...bc,
      data: { ...data, url: sanitizeUrl(url) },
    }
  })

  return {
    ...event,
    breadcrumbs: sanitizedBreadcrumbs,
  }
}