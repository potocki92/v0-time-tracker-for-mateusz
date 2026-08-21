import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

/**
 * Skanujemy kod bez komentarzy — komentarz wyjasniajacy, DLACZEGO gdzies nie ma
 * juz `<main>`, sam zawiera te sekwencje i falszywie podnosilby alarm.
 * Ten sam zabieg co w navigation-perf.test.ts. `{/* … *\/}` w JSX to w srodku
 * zwykly blok `/* … *\/`, wiec lapie go to samo wyrazenie.
 */
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else if (/\.tsx$/.test(entry)) acc.push(relative(ROOT, full))
  }
  return acc
}

const PANEL_FILES = walk(resolve(ROOT, 'app/(app)')).concat(walk(resolve(ROOT, 'features')))

describe('layout — landmarki', () => {
  it('w panelu tylko AppShell renderuje <main>', () => {
    const offenders = PANEL_FILES.filter(
      (f) => !f.endsWith('AppShell.tsx') && /<main[\s>]/.test(stripComments(read(f))),
    )
    expect(
      offenders,
      `drugi landmark main duplikuje sie z tym z AppShell i lamie skip-link; uzyj <div>:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('AppShell renderuje dokladnie jeden main z celem skip-linka', () => {
    const shell = stripComments(read('app/(app)/_layout/AppShell.tsx'))
    expect(shell.match(/<main[\s>]/g) ?? []).toHaveLength(1)
    expect(shell).toMatch(/id="main-content"/)
  })
})
