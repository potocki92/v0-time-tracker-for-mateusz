import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else if (/\.(ts|tsx)$/.test(entry)) acc.push(relative(ROOT, full))
  }
  return acc
}

const APP_PAGES = walk(resolve(ROOT, 'app/(app)')).filter((f) => /page\.tsx$/.test(f))

describe('nawigacja — Router Cache', () => {
  const config = read('next.config.mjs')

  it('deklaruje experimental.staleTimes', () => {
    expect(
      config,
      'bez staleTimes Next 15 nie cache’uje segmentow dynamicznych — kazde wejscie na sekcje to pelny RSC + skeleton',
    ).toMatch(/staleTimes/)
  })

  it('trzyma staleTimes.dynamic powyzej zera', () => {
    const match = config.match(/dynamic:\s*(\d+)/)
    expect(match, 'brak staleTimes.dynamic w next.config.mjs').not.toBeNull()
    expect(
      Number(match![1]),
      'dynamic: 0 = brak cache = objaw wraca',
    ).toBeGreaterThan(0)
  })
})
