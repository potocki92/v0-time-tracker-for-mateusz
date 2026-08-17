/**
 * #10 — NEXT_PUBLIC_ env vars audit
 *
 * Problem: brak walidacji środowiska przy buildzie → app crashuje w runtime
 * z niejasnym błędem. Gorsze: sekrety mogą przypadkowo trafić do bundle klienta
 * przez prefiks NEXT_PUBLIC_.
 *
 * Rozwiązanie:
 * 1. Zod schema osobno dla SERVER i CLIENT env vars
 * 2. Walidacja przy starcie — fail fast z czytelnym błędem
 * 3. Eksport typowanych obiektów `serverEnv` i `clientEnv`
 * 4. Audit: żaden sekret (SERVICE_ROLE_KEY, DATABASE_URL) nie jest NEXT_PUBLIC_
 *
 * Użycie:
 *   import { serverEnv } from '@/lib/env'   // tylko w Server Components / Route Handlers
 *   import { clientEnv } from '@/lib/env'   // w Client Components (trafia do bundle)
 *
 * Plik: src/lib/env.ts
 */

import { z } from 'zod'

// ── Pomocniki ─────────────────────────────────────────────────────────────────

/** Przetwarza string na URL — czytelny błąd zamiast "invalid_string" */
const urlSchema = z.string().url()

/** Przetwarza string na liczbę z walidacją zakresu */
const _portSchema = z
  .string()
  .transform(Number)
  .pipe(z.number().int().min(1).max(65535))

// ── SERVER env schema ─────────────────────────────────────────────────────────
// ⚠️  Te zmienne NIE mogą mieć prefiksu NEXT_PUBLIC_ — trafiłyby do bundle klienta.
// Dostępne tylko w: Server Components, Route Handlers, API Routes, Middleware.

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Supabase — Service Role (admin bypass RLS)
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required')
    .refine(
      (k) => !k.startsWith('NEXT_PUBLIC_'),
      'Service role key must NEVER be prefixed with NEXT_PUBLIC_',
    ),

  // Supabase — URL (server-side też potrzebuje, bez NEXT_PUBLIC_)
  SUPABASE_URL: urlSchema,

  // Database direct connection (np. dla migracji, Prisma)
  DATABASE_URL: z
    .string()
    .min(1)
    .optional()
    .refine(
      (v) => !v?.startsWith('NEXT_PUBLIC_'),
      'DATABASE_URL must never be public',
    ),

  // Upstash Redis (rate limiting w Edge Functions)
  UPSTASH_REDIS_REST_URL:   urlSchema.optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // Sentry DSN (server-side tracing)
  SENTRY_DSN:         z.string().url().optional(),
  SENTRY_AUTH_TOKEN:  z.string().min(1).optional(),

  // NBP API (kurs EUR — server-side fetch)
  NBP_API_BASE_URL: urlSchema.default('https://api.nbp.pl/api'),
})

// ── CLIENT env schema ─────────────────────────────────────────────────────────
// ✅  Te zmienne MOGĄ mieć prefiks NEXT_PUBLIC_ — trafiają do bundle klienta.
// Żadnych sekretów tutaj. Zasada: jeśli nie chcesz żeby user to widział → nie tutaj.

export const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL:      urlSchema,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

  // Klucz publiczny VAPID do Web Push — bezpieczny do eksponowania
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_VAPID_PUBLIC_KEY is required — wygeneruj przez: npx web-push generate-vapid-keys'),

  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

  NEXT_PUBLIC_ENABLE_RATE_LIMIT: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),

  NEXT_PUBLIC_APP_URL: urlSchema.default('http://localhost:3000'),
})


// ── Audit: blokada sekretów w NEXT_PUBLIC_ ────────────────────────────────────

const FORBIDDEN_PUBLIC_PATTERNS = [
  'SERVICE_ROLE',
  'SECRET',
  'DATABASE_URL',
  'PRIVATE',
  'UPSTASH',
  'SENTRY_AUTH',
]

function auditPublicVars(env: Record<string, string | undefined>): void {
  const violations: string[] = []

  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith('NEXT_PUBLIC_')) continue

    for (const pattern of FORBIDDEN_PUBLIC_PATTERNS) {
      if (key.toUpperCase().includes(pattern)) {
        violations.push(`❌ ${key} — contains "${pattern}" and is NEXT_PUBLIC_`)
      }
    }

    // Heurystyka: długie losowe stringi w NEXT_PUBLIC_ to prawdopodobnie sekrety
    if (value && value.length > 80 && /^[a-zA-Z0-9._-]+$/.test(value)) {
      violations.push(`⚠️  ${key} — długi token w NEXT_PUBLIC_, sprawdź czy to sekret`)
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `\n🔐 ENV AUDIT FAILED — potencjalne wycieki sekretów:\n${violations.join('\n')}\n`,
    )
  }
}

// ── Walidacja i eksport ───────────────────────────────────────────────────────

function validateEnv() {
  // Audit przed parsowaniem
  auditPublicVars(process.env as Record<string, string | undefined>)

  const serverResult = serverSchema.safeParse(process.env)
  const clientResult = clientSchema.safeParse(process.env)

  const errors: string[] = []

  if (!serverResult.success) {
    errors.push(
      '🔴 SERVER env errors:\n' +
      serverResult.error.errors
        .map((e) => `  ${e.path.join('.')}: ${e.message}`)
        .join('\n'),
    )
  }

  if (!clientResult.success) {
    errors.push(
      '🔴 CLIENT env errors:\n' +
      clientResult.error.errors
        .map((e) => `  ${e.path.join('.')}: ${e.message}`)
        .join('\n'),
    )
  }

  if (errors.length > 0) {
    throw new Error(`\n⚙️  Invalid environment variables:\n\n${errors.join('\n\n')}\n`)
  }

  return {
    server: serverResult.data!,
    client: clientResult.data!,
  }
}

// ── Singleton — walidacja raz przy starcie ────────────────────────────────────

const _validated = validateEnv()

/**
 * Typowane zmienne środowiskowe — SERWER.
 * Import tylko w Server Components, Route Handlers, Server Actions.
 *
 * @throws Error przy buildzie jeśli brakuje wymaganej zmiennej
 */
export const serverEnv = _validated.server

/**
 * Typowane zmienne środowiskowe — KLIENT.
 * Bezpieczne do importu w Client Components.
 * Zawiera WYŁĄCZNIE zmienne z prefiksem NEXT_PUBLIC_.
 */
export const clientEnv = _validated.client

// Typy eksportowane dla użycia w funkcjach
export type ServerEnv = typeof serverEnv
export type ClientEnv = typeof clientEnv