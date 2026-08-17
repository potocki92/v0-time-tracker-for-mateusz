import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8')

const pkg = JSON.parse(read('package.json')) as {
  scripts: Record<string, string>
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}

const major = (v: string) => v.replace(/[^0-9.]/g, '').split('.')[0]

describe('quality gates — package.json', () => {
  it('exposes typecheck, lint and verify scripts', () => {
    expect(pkg.scripts.typecheck).toBe('tsc --noEmit')
    expect(pkg.scripts.lint).toBe('eslint .')
    for (const step of ['typecheck', 'lint', 'test', 'build']) {
      expect(pkg.scripts.verify).toContain(step)
    }
  })

  it('keeps build tooling out of runtime dependencies', () => {
    for (const dep of ['vitest', 'autoprefixer', 'eslint', 'typescript']) {
      expect(pkg.dependencies[dep], `${dep} nie moze byc runtime dependency`).toBeUndefined()
    }
  })

  it('pins React type packages to the React major version', () => {
    expect(major(pkg.devDependencies['@types/react'])).toBe(major(pkg.dependencies.react))
    expect(major(pkg.devDependencies['@types/react-dom'])).toBe(
      major(pkg.dependencies['react-dom']),
    )
  })
})

describe('quality gates — tsconfig.json', () => {
  const ts = read('tsconfig.json')

  it('targets ES2022', () => {
    expect(ts).toContain('"target": "ES2022"')
  })

  it('keeps strict mode and override/fallthrough guards', () => {
    expect(ts).toContain('"strict": true')
    expect(ts).toContain('"noImplicitOverride": true')
    expect(ts).toContain('"noFallthroughCasesInSwitch": true')
  })
})

describe('quality gates — next.config.mjs', () => {
  const cfg = read('next.config.mjs')

  it('leaves no placeholder in remotePatterns', () => {
    expect(cfg).not.toMatch(/hostname:\s*'[^']*[<>]/)
  })

  it('declares a concrete supabase host', () => {
    expect(cfg).toContain("hostname: '*.supabase.co'")
  })
})

describe('quality gates — eslint', () => {
  it('has a flat config at the repo root', () => {
    expect(() => read('eslint.config.mjs')).not.toThrow()
  })
})
