/**
 * Fix: NODE_ENV jest dostępne przez process.env bezpośrednio w Next.js —
 * nie jest częścią clientEnv (który zawiera tylko NEXT_PUBLIC_* zmienne).
 * Next.js automatycznie zastępuje process.env.NODE_ENV w bundle klienta.
 */

import * as Sentry from '@sentry/nextjs'
import { SENTRY_IGNORED_ERRORS, sentryBeforeSend } from '@/lib/monitoring/sentry'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Fix: process.env.NODE_ENV zamiast clientEnv.NODE_ENV
  enabled: process.env.NODE_ENV === 'production',

  tracesSampleRate:         0.1,
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllInputs: true,
      blockAllMedia: false,
      mask: ['.invoice-amount', '.earnings-value', '[data-sensitive]'],
    }),
  ],

  ignoreErrors: [...SENTRY_IGNORED_ERRORS],
  beforeSend:   sentryBeforeSend,

  denyUrls: [/localhost/, /127\.0\.0\.1/],
})