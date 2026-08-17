import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8')

const knip = JSON.parse(read('knip.json')) as {
  entry?: string[]
  next?: { entry?: string[] }
  ignore?: string[]
}

const pkg = JSON.parse(read('package.json')) as {
  scripts: Record<string, string>
  dependencies: Record<string, string>
}

/** Usuniete w Etapie 2. Kazdy powrot ma byc swiadomy, nie przypadkowy. */
const REMOVED_DEPENDENCIES = [
  '@radix-ui/react-accordion',
  '@radix-ui/react-alert-dialog',
  '@radix-ui/react-aspect-ratio',
  '@radix-ui/react-context-menu',
  '@radix-ui/react-hover-card',
  '@radix-ui/react-menubar',
  '@radix-ui/react-navigation-menu',
  '@radix-ui/react-radio-group',
  '@radix-ui/react-scroll-area',
  '@radix-ui/react-slider',
  '@radix-ui/react-toast',
  '@radix-ui/react-toggle',
  '@radix-ui/react-toggle-group',
  'date-fns',
  'embla-carousel-react',
  'geist',
  'input-otp',
  'react-day-picker',
  'react-resizable-panels',
  'tailwindcss-animate',
  'vaul',
]

describe('dead code — knip config', () => {
  it('registers the Next.js entry points so route files are never reported unused', () => {
    const entries = knip.next?.entry ?? []
    expect(entries).toContain('middleware.ts')
    expect(entries.some((e) => e.includes('app/**/{page'))).toBe(true)
  })

  it('never ignores a source directory — that would neuter the gate', () => {
    const forbidden = ['app', 'features', 'components', 'lib', 'hooks', 'services']
    for (const pattern of knip.ignore ?? []) {
      const root = pattern.split('/')[0]
      expect(forbidden, `knip.ignore nie moze zawierac ${pattern}`).not.toContain(root)
    }
  })

  // Usun ten test, jesli w zadaniu 6 wybrales wariant B.
  it('registers the service worker, which the browser loads directly', () => {
    expect(knip.entry ?? []).toContain('public/sw.js')
    expect(existsSync(resolve(process.cwd(), 'public/sw.js'))).toBe(true)
  })
})

describe('dead code — pipeline', () => {
  const workflow = parse(read('.github/workflows/ci.yml')) as {
    jobs: Record<string, { steps: Array<{ run?: string }> }>
  }

  it('exposes a deadcode script wired into verify', () => {
    expect(pkg.scripts.deadcode).toContain('knip')
    expect(pkg.scripts.verify).toContain('npm run deadcode')
  })

  it('runs the dead-code gate in CI', () => {
    const commands = workflow.jobs.verify.steps.map((s) => s.run ?? '').join('\n')
    expect(commands).toContain('npm run deadcode')
  })
})

describe('dead code — dependencies', () => {
  it('does not silently reintroduce the packages removed in stage 2', () => {
    for (const dep of REMOVED_DEPENDENCIES) {
      expect(
        pkg.dependencies[dep],
        `${dep} wrocil — dodaj go swiadomie i usun z tej listy`,
      ).toBeUndefined()
    }
  })

  it('declares server-only explicitly instead of relying on a transitive install', () => {
    expect(pkg.dependencies['server-only']).toBeDefined()
  })
})
