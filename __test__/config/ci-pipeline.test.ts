import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8')
const exists = (p: string) => existsSync(resolve(process.cwd(), p))

type Step = { name?: string; uses?: string; run?: string; with?: Record<string, unknown> }
type Workflow = { on?: Record<string, unknown>; jobs: Record<string, { steps: Step[] }> }

// YAML 1.1 traktuje `on` jako boolean — parser moze zwrocic klucz `true`.
const raw = parse(read('.github/workflows/ci.yml')) as Workflow & Record<string, unknown>
const triggers = (raw.on ?? (raw as Record<string, unknown>)['true']) as Record<string, unknown>
const steps = raw.jobs.verify.steps

describe('CI — workflow', () => {
  it('runs on pull requests and on main', () => {
    expect(Object.keys(triggers)).toContain('pull_request')
    expect(Object.keys(triggers)).toContain('push')
  })

  it('runs every quality gate', () => {
    const commands = steps.map((s) => s.run ?? '').join('\n')
    const gates = [
      'npm ci',
      'npm run typecheck',
      'npm run test',
      'npm run lint',
      'npm run build',
      'npm run perf:budget',
    ]
    for (const gate of gates) {
      expect(commands, `brak kroku: ${gate}`).toContain(gate)
    }
  })

  it('fails fast — cheap gates before the build', () => {
    const names = steps.map((s) => s.name)
    expect(names.indexOf('Typecheck')).toBeLessThan(names.indexOf('Build'))
    expect(names.indexOf('Test')).toBeLessThan(names.indexOf('Build'))
    expect(names.indexOf('Lint')).toBeLessThan(names.indexOf('Build'))
  })

  it('pins the Node version from .nvmrc instead of hardcoding it', () => {
    const setupNode = steps.find((s) => s.uses?.startsWith('actions/setup-node'))
    expect(setupNode?.with?.['node-version-file']).toBe('.nvmrc')
    expect(setupNode?.with?.['node-version']).toBeUndefined()
    expect(exists('.nvmrc')).toBe(true)
    expect(read('.nvmrc').trim()).toMatch(/^\d+$/)
  })
})

describe('CI — package manager', () => {
  it('keeps exactly one lockfile so npm ci is deterministic', () => {
    expect(exists('package-lock.json')).toBe(true)
    expect(exists('pnpm-lock.yaml'), 'usun pnpm-lock.yaml').toBe(false)
    expect(exists('bun.lock'), 'usun bun.lock').toBe(false)
  })

  it('pins peer-dependency resolution in .npmrc so local and CI agree', () => {
    expect(read('.npmrc')).toContain('legacy-peer-deps=true')
  })
})

describe('CI — performance budgets', () => {
  const budgets = JSON.parse(read('performance-budgets.json')) as Record<string, number>

  it('tracks every app route', () => {
    expect(Object.keys(budgets).length).toBeGreaterThan(0)
    for (const route of Object.keys(budgets)) {
      expect(route.endsWith('/page'), `${route} nie jest trasa`).toBe(true)
    }
  })

  it('holds finite positive limits', () => {
    for (const [route, kb] of Object.entries(budgets)) {
      expect(Number.isFinite(kb), `${route} ma nieliczbowy limit`).toBe(true)
      expect(kb, `${route} ma limit <= 0`).toBeGreaterThan(0)
    }
  })

  it('caps the marketing landing page — it is the public first impression', () => {
    expect(budgets['/(marketing)/page']).toBeLessThanOrEqual(250)
  })
})
