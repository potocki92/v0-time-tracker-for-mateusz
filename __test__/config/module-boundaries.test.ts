import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const SCANNED = ['app', 'features', 'components', 'hooks', 'lib', 'services']
const CODE = /\.(ts|tsx)$/

/**
 * Dynamiczne importy sa celowo glebokie tam, gdzie chodzi o granice chunka.
 * Kazdy wpis wymaga uzasadnienia — lista ma zostac krotka.
 */
const CODE_SPLIT_EXCEPTIONS: Record<string, string> = {
  'hooks/useExportData.ts':
    'lazy chunk generatora PDF — import przez barrel wciagnalby caly modul dashboardu do chunka',
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else if (CODE.test(entry)) acc.push(full)
  }
  return acc
}

const files = SCANNED.flatMap((d) => walk(resolve(ROOT, d)))

/** Trzy publiczne wejscia: barrel, /domain (czysta logika), /server (server-only). */
const isPublicEntry = (spec: string) =>
  /^@\/features\/[a-z0-9-]+$/.test(spec) ||
  /^@\/features\/[a-z0-9-]+\/(domain|server)$/.test(spec)

const featureOf = (file: string) => {
  const rel = relative(ROOT, file)
  return rel.startsWith('features/') ? rel.split('/')[1] : null
}

describe('module boundaries — feature internals stay private', () => {
  it('nobody imports past a feature public entry', () => {
    const violations: string[] = []

    for (const file of files) {
      const rel = relative(ROOT, file)
      const source = readFileSync(file, 'utf8')
      const own = featureOf(file)

      const specs = [
        ...source.matchAll(/from\s+['"](@\/features\/[^'"]+)['"]/g),
        ...source.matchAll(/import\(\s*['"](@\/features\/[^'"]+)['"]\s*\)/g),
      ].map((m) => m[1])

      for (const spec of specs) {
        if (isPublicEntry(spec)) continue
        if (own && spec.startsWith(`@/features/${own}/`)) {
          violations.push(`${rel}: ${spec} (wlasny modul — uzyj sciezki wzglednej)`)
          continue
        }
        if (CODE_SPLIT_EXCEPTIONS[rel]) continue
        violations.push(`${rel}: ${spec}`)
      }
    }

    expect(violations, `naruszenia granic:\n${violations.join('\n')}`).toEqual([])
  })

  it('every code-splitting exception carries a justification', () => {
    for (const [file, reason] of Object.entries(CODE_SPLIT_EXCEPTIONS)) {
      expect(reason.length, `${file} bez uzasadnienia`).toBeGreaterThan(20)
    }
  })
})

describe('module boundaries — one home per domain', () => {
  const featureDirs = readdirSync(resolve(ROOT, 'features')).filter((d) =>
    statSync(resolve(ROOT, 'features', d)).isDirectory(),
  )

  it('every feature exposes a public API', () => {
    for (const feature of featureDirs) {
      const barrel = resolve(ROOT, 'features', feature, 'index.ts')
      expect(() => readFileSync(barrel, 'utf8'), `brak features/${feature}/index.ts`).not.toThrow()
    }
  })

  it('the routing layer holds no domain, hook or service directories', () => {
    const strays = walk(resolve(ROOT, 'app'))
      .map((f) => relative(ROOT, f))
      .filter((f) => /\/_(domain|hooks|services)\//.test(f))

    expect(strays, `logika domenowa w app/:\n${strays.join('\n')}`).toEqual([])
  })
})
