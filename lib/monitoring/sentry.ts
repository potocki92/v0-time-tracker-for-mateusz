import * as Sentry from '@sentry/nextjs'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SentryUserContext {
  id:       string
  segment?: 'free' | 'pro'
}

interface CaptureOptions {
  tags?:  Record<string, string>
  extra?: Record<string, unknown>
  level?: Sentry.SeverityLevel
}

// ── User context ──────────────────────────────────────────────────────────────

async function hashUserId(userId: string): Promise<string> {
  const encoder = new TextEncoder()
  const data    = encoder.encode(userId)
  const hash    = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function setSentryUser(
  userId: string,
  context?: { segment?: SentryUserContext['segment'] },
): Promise<void> {
  const hashedId = await hashUserId(userId)
  Sentry.setUser({ id: hashedId, segment: context?.segment })
}

export function clearSentryUser(): void {
  Sentry.setUser(null)
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
  const rawValues = event.breadcrumbs?.values
  if (!rawValues || rawValues.length === 0) {
    return event
  }

  const sanitizedValues = rawValues.map((bc) => {
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
    breadcrumbs: {
      ...event.breadcrumbs,
      values: sanitizedValues,
    },
  }
}