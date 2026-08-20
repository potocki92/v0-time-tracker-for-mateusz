import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> }
const config = read('playwright.config.ts')
const specs = readdirSync(resolve(ROOT, 'e2e')).filter((f) => f.endsWith('.spec.ts'))

/** Sciezki, ktorych zepsucie oznacza, ze produkt nie zarabia. */
const CRITICAL_PATHS = ['auth', 'work-entry', 'invoice', 'export', 'navigation']

describe('e2e — suite covers the critical paths', () => {
  it('has one spec per critical path', () => {
    for (const path of CRITICAL_PATHS) {
      expect(specs, `brak e2e/${path}.spec.ts`).toContain(`${path}.spec.ts`)
    }
  })

  it('reuses a stored session instead of logging in per test', () => {
    expect(config).toMatch(/auth\\?\.setup\\?\.ts/)
    expect(config).toContain('storageState')
    expect(config).toMatch(/dependencies:\s*\['setup'\]/)
  })

  it('filters tagged tests with grep, not testMatch', () => {
    // testMatch filtruje sciezki plikow — tag @mobile w tytule nigdy by nie trafil.
    expect(config).not.toMatch(/testMatch:\s*\/@/)
  })
})

describe('e2e — specs stay maintainable', () => {
  it('locates elements by role or label, never by CSS class', () => {
    const offenders: string[] = []
    for (const spec of [...specs, 'auth.setup.ts']) {
      const src = read(`e2e/${spec}`)
      for (const m of src.matchAll(/(?:page|locator)\.locator\(\s*['"]([^'"]+)['"]/g)) {
        if (/^[.#]/.test(m[1])) offenders.push(`${spec}: ${m[1]}`)
      }
    }
    expect(
      offenders,
      `selektory CSS lamia sie przy kazdym refaktorze stylow; uzyj getByRole / getByLabel / getByTestId:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('never sleeps on a fixed timeout', () => {
    const offenders = [...specs, 'auth.setup.ts'].filter((s) =>
      /waitForTimeout\(/.test(read(`e2e/${s}`)),
    )
    expect(
      offenders,
      `waitForTimeout daje flaky testy; czekaj na stan (expect/waitForURL):\n${offenders.join('\n')}`,
    ).toEqual([])
  })
})

describe('e2e — seeding is fenced off from production', () => {
  it('refuses to run against a non-local database', () => {
    const seed = read('e2e/seed.ts')
    expect(seed).toMatch(/localhost|127\.0\.0\.1/)
    expect(seed, 'seed musi przerwac na zdalnym URL').toMatch(/throw new Error/)
  })

  it('never hardcodes credentials', () => {
    for (const file of ['e2e/seed.ts', 'e2e/fixtures/test-user.ts']) {
      expect(read(file)).not.toMatch(/(password|key)\s*[:=]\s*['"][^'"$]{8,}['"]/i)
    }
  })
})

describe('e2e — wiring', () => {
  const workflow = parse(read('.github/workflows/e2e.yml')) as {
    jobs: Record<string, { steps: Array<{ run?: string }> }>
  }

  it('exposes e2e scripts', () => {
    expect(pkg.scripts.e2e).toContain('playwright test')
    expect(pkg.scripts['e2e:seed']).toBeDefined()
  })

  it('keeps e2e out of the fast verify loop', () => {
    // E2E potrzebuje bazy i przegladarki — verify ma zostac szybki i offline.
    expect(pkg.scripts.verify).not.toContain('e2e')
  })

  it('seeds, builds and runs in its own workflow', () => {
    const commands = workflow.jobs.e2e.steps.map((s) => s.run ?? '').join('\n')
    for (const step of ['npm ci', 'supabase start', 'npm run e2e:seed', 'npm run build', 'npm run e2e']) {
      expect(commands, `brak kroku: ${step}`).toContain(step)
    }
  })

  it('keeps report output out of git', () => {
    const ignored = read('.gitignore')
    for (const path of ['e2e/.auth/', 'e2e/.results/', 'e2e/.report']) {
      expect(ignored, `${path} musi byc w .gitignore`).toContain(path)
    }
  })
})

describe('e2e — security and accessibility gates', () => {
  const workflow = parse(read('.github/workflows/e2e.yml')) as {
    jobs: Record<string, { steps: Array<{ run?: string; env?: Record<string, string> }> }>
  }

  it('runs the RLS suite in CI', () => {
    const commands = workflow.jobs.e2e.steps.map((s) => s.run ?? '').join('\n')
    expect(commands, 'test:rls musi byc w workflow — 11 testow bezpieczenstwa').toContain(
      'npm run test:rls',
    )
  })

  it('passes both RLS users to the suite', () => {
    const rls = workflow.jobs.e2e.steps.find((s) => s.run?.includes('test:rls'))
    for (const key of [
      'TEST_SUPABASE_URL',
      'TEST_SUPABASE_ANON_KEY',
      'TEST_USER_A_EMAIL',
      'TEST_USER_B_EMAIL',
    ]) {
      expect(rls?.env?.[key], `brak ${key}`).toBeDefined()
    }
  })

  it('seeds both RLS users', () => {
    const seed = read('e2e/seed.ts')
    for (const key of ['TEST_USER_A_EMAIL', 'TEST_USER_B_EMAIL']) {
      expect(seed, `seed musi zakladac ${key}`).toContain(key)
    }
    // Jeden zestaw zmiennych — `E2E_USER_*` bylo drugim, trzymanym recznie w synchronizacji.
    expect(seed).not.toContain('E2E_USER_')
    expect(read('e2e/fixtures/test-user.ts')).not.toContain('E2E_USER_')
  })

  it('scans the main routes with axe', () => {
    const spec = read('e2e/a11y.spec.ts')
    for (const route of ['/dashboard', '/calendar', '/clients', '/invoices']) {
      expect(spec, `brak skanu ${route}`).toContain(route)
    }
    expect(spec).toContain('wcag2aa')
  })

  it('silences no axe rule without a written reason', () => {
    const spec = read('e2e/a11y.spec.ts')
    for (const m of spec.matchAll(/disableRules\(\[([^\]]+)\]\)/g)) {
      if (m[1].trim() === '') continue
      const before = spec.slice(Math.max(0, m.index! - 200), m.index!)
      expect(before, `disableRules bez komentarza z uzasadnieniem`).toMatch(/\/\/|\/\*/)
    }
  })
})
