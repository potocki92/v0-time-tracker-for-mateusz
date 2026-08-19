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
const CRITICAL_PATHS = ['auth', 'work-entry', 'invoice', 'export']

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
