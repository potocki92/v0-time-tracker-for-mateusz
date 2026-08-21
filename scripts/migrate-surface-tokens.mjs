#!/usr/bin/env node
/**
 * Jednorazowy codemod: literaly hex → tokeny skali powierzchni.
 * Po udanej migracji ten plik jest usuwany (KROK 6) — zostaje w historii gita.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = process.cwd()

/**
 * Mapowanie. Bliskie odcienie skladane w jeden stopien skali —
 * najwieksza roznica to #1f1f1f → hairline (ΔL 1.3%) i #17171a → surface-3 (ΔL 1.5%).
 * Ponizej progu dostrzegalnosci, powyzej progu "to sa dwa rozne szare".
 */
const MAP = {
  // tla
  'bg-[#0a0a0a]': 'bg-surface-1',
  'bg-[#0c0c0c]': 'bg-surface-1',
  'bg-[#0e0e0e]': 'bg-surface-2',
  'bg-[#101012]': 'bg-surface-2',
  'bg-[#111]': 'bg-surface-3',
  'bg-[#141414]': 'bg-surface-3',
  'bg-[#151519]': 'bg-surface-3',
  'bg-[#161616]': 'bg-surface-3',
  'bg-[#17171a]': 'bg-surface-3',
  'bg-[#1a1a1a]': 'bg-hairline',
  'bg-[#212126]': 'bg-hairline-strong',
  // kontury
  'border-[#161616]': 'border-hairline',
  'border-[#1a1a1a]': 'border-hairline',
  'border-[#1f1f1f]': 'border-hairline',
  'border-[#212126]': 'border-hairline-strong',
  'border-[#262626]': 'border-hairline-strong',
  'border-[#2a2a30]': 'border-hairline-strong',
  // separatory
  'divide-[#161616]': 'divide-hairline',
  'divide-[#1a1a1a]': 'divide-hairline',
  'divide-[#212126]': 'divide-hairline-strong',
  // ringi
  'ring-[#0a0a0a]': 'ring-surface-1',
  'ring-[#151519]': 'ring-surface-3',
  'ring-[#1f1f1f]': 'ring-hairline',
  'ring-[#2a2a30]': 'ring-hairline-strong',
  // czern jako tlo strony — wraz z wariantami krycia
  'bg-black/85': 'bg-surface-0/85',
  'bg-black/80': 'bg-surface-0/80',
  'bg-black/60': 'bg-surface-0/60',
  'bg-black': 'bg-surface-0',
}

// Dluzsze klucze pierwsze — inaczej `bg-black` zjadloby `bg-black/85`.
const KEYS = Object.keys(MAP).sort((a, b) => b.length - a.length)

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else if (/\.tsx$/.test(entry)) acc.push(full)
  }
  return acc
}

/**
 * Klasy Tailwinda mieszkaja glownie w .tsx, ale Projects i Clients trzymaja
 * swoje palety w modulach .ts. Bez tych dwoch plikow oba moduly zostalyby
 * jedynymi miejscami z zahardkodowanymi powierzchniami — i jedynymi, ktore
 * nie reaguja na przelacznik motywu.
 */
const EXTRA = [
  'features/projects/components/linear/linear.tokens.ts',
  'features/clients/components/clients.tokens.ts',
]

const files = [
  ...['app', 'features', 'components'].flatMap((d) => walk(resolve(ROOT, d))),
  ...EXTRA.map((f) => resolve(ROOT, f)),
]
let touched = 0
let replaced = 0

for (const file of files) {
  const before = readFileSync(file, 'utf8')
  let after = before
  for (const key of KEYS) {
    const parts = after.split(key)
    if (parts.length > 1) {
      replaced += parts.length - 1
      after = parts.join(MAP[key])
    }
  }
  if (after !== before) {
    writeFileSync(file, after)
    touched += 1
  }
}

console.log(`${replaced} podmian w ${touched} plikach`)
