import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else if (/\.(ts|tsx)$/.test(entry)) acc.push(full)
  }
  return acc
}

const sources = ['app', 'features', 'components', 'hooks', 'lib'].flatMap((d) =>
  walk(resolve(ROOT, d)),
)

describe('bundle hygiene — framer-motion', () => {
  it('uses the lightweight m.* namespace, never the full motion.* proxy', () => {
    const offenders = sources
      .filter((f) => /\bmotion\.[a-zA-Z]/.test(read(relative(ROOT, f))))
      .map((f) => relative(ROOT, f))

    expect(
      offenders,
      `motion.* wciaga caly framer-motion; uzyj m.* pod <MotionProvider>:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('never mounts MotionProvider in the root layout', () => {
    // W rootcie shell LazyMotion trafia takze do tras bez animacji: +11,4 kB kazda.
    expect(read('app/layout.tsx')).not.toContain('MotionProvider')
    expect(read('app/providers.tsx')).not.toContain('LazyMotion')
  })
})

describe('bundle hygiene — auth routes stay light', () => {
  const authFiles = walk(resolve(ROOT, 'app/auth')).map((f) => relative(ROOT, f))

  it('never instantiates the Supabase browser client', () => {
    const offenders = authFiles.filter((f) => read(f).includes('@/lib/supabase/client'))
    expect(
      offenders,
      `supabase-js to ~62 kB gzip; auth uzywa Server Actions:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('never pulls TanStack Query into the auth subtree', () => {
    const offenders = authFiles.filter((f) => read(f).includes('@tanstack/react-query'))
    expect(
      offenders,
      `Providers zyje w (app); auth musi zostac bez nich:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('keeps zod out of the auth client bundle', () => {
    // `auth.schema.ts` importuje zod (~14 kB gzip) — klient moze siegac
    // wylacznie po `auth.constants.ts`, schemat wykonuje sie w akcji serwerowej.
    const clientFiles = authFiles.filter(
      (f) => read(f).startsWith("'use client'") && !f.includes('/_actions/'),
    )
    const offenders = clientFiles.filter((f) => read(f).includes('@/lib/schemas/auth.schema'))

    expect(
      offenders,
      `import z auth.schema wciaga zod do trasy auth; uzyj @/lib/schemas/auth.constants:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('drives login and sign-up through server actions', () => {
    for (const action of [
      'app/auth/_actions/login.action.ts',
      'app/auth/_actions/sign-up.action.ts',
    ]) {
      expect(read(action).startsWith("'use server'"), `${action} bez 'use server'`).toBe(true)
    }
  })
})

describe('bundle hygiene — data access lives on the server', () => {
  const appFiles = walk(resolve(ROOT, 'app/(app)'))
    .concat(walk(resolve(ROOT, 'features')))
    .map((f) => relative(ROOT, f))

  it('never instantiates the Supabase browser client', () => {
    const offenders = appFiles.filter((f) => read(f).includes('@/lib/supabase/client'))
    expect(
      offenders,
      `supabase-js to 61,8 kB gzip na kazdej trasie; uzyj Server Action:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('never reaches for the service-role key outside the seed script', () => {
    const offenders = appFiles.filter((f) => read(f).includes('SUPABASE_SERVICE_ROLE_KEY'))
    expect(
      offenders,
      `service-role omija RLS — Server Actions uzywaja anon key + ciasteczek:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('revalidates after every mutating action', () => {
    const actionFiles = appFiles.filter((f) => /\/actions\.ts$/.test(f))
    expect(actionFiles.length, 'brak plikow actions.ts').toBeGreaterThan(0)
    for (const file of actionFiles) {
      const src = read(file)
      if (!/\.(insert|update|delete|upsert)\(/.test(src)) continue
      expect(src, `${file}: mutacja bez revalidatePath`).toContain('revalidatePath')
    }
  })
})

describe('bundle hygiene — providers are scoped to the app group', () => {
  it('mounts Providers in (app)/layout, not in the root layout', () => {
    expect(read('app/(app)/layout.tsx')).toContain('Providers')
    expect(read('app/layout.tsx')).not.toContain("from './providers'")
  })
})

describe('bundle hygiene — fonts', () => {
  it('loads exactly one monospace family across the layouts', () => {
    const layouts = ['app/layout.tsx', 'app/(marketing)/layout.tsx'].map(read).join('\n')
    const monoFamilies = [...layouts.matchAll(/\b([A-Za-z_]+_Mono)\b/g)].map((m) => m[1])

    expect(
      [...new Set(monoFamilies)],
      'dwie rodziny monospace to dwa pobrania fontu — wybierz jedna',
    ).toHaveLength(1)
  })

  it('opens no connection to the Google Fonts CDN — next/font self-hosts', () => {
    expect(read('app/layout.tsx')).not.toContain('fonts.gstatic.com')
    expect(read('app/layout.tsx')).not.toContain('fonts.googleapis.com')
  })
})

describe('bundle hygiene — build pipeline', () => {
  const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> }

  it('keeps the production build on webpack', () => {
    // Zmierzone: turbopack build daje +9 do +16 kB na trase w tym projekcie.
    expect(pkg.scripts.build).toBe('next build')
    expect(pkg.scripts.dev).toContain('--turbopack')
  })
})
