#!/usr/bin/env node
/**
 * Budzet First Load JS per trasa.
 *
 * Metryka: suma rozmiarow (gzip) wszystkich chunkow JS, ktore przegladarka musi
 * pobrac, zeby wyrenderowac trase = pliki trasy + pliki wszystkich jej layoutow.
 *
 * To WLASNA metryka, celowo niezalezna od formatu outputu `next build`.
 * Wartosci sa o kilka procent wyzsze niz "First Load JS" drukowane przez Next
 * (inne dedupe polyfilli) — nie porownuj ich 1:1. Liczy sie trend, nie liczba.
 *
 *   node scripts/check-performance-budgets.mjs           # sprawdz budzety
 *   node scripts/check-performance-budgets.mjs --init    # zapisz obecny stan jako baseline
 *   node scripts/check-performance-budgets.mjs --report  # tylko wypisz, nie faluj
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const MANIFEST = '.next/app-build-manifest.json'
const BUDGETS = 'performance-budgets.json'
const HEADROOM = 1.05

const args = new Set(process.argv.slice(2))
const isInit = args.has('--init')
const isReport = args.has('--report')

if (!existsSync(MANIFEST)) {
  console.error(`[perf:budget] Brak ${MANIFEST}. Uruchom najpierw \`npm run build\`.`)
  process.exit(1)
}

const pages = JSON.parse(readFileSync(MANIFEST, 'utf8')).pages

/** Layouty owijajace dana trase, od roota w dol. */
function layoutsFor(routeKey) {
  const segments = routeKey.split('/').slice(1, -1)
  const layouts = ['/layout']
  let path = ''
  for (const segment of segments) {
    path += `/${segment}`
    if (pages[`${path}/layout`]) layouts.push(`${path}/layout`)
  }
  return layouts
}

const gzipKb = (file) => gzipSync(readFileSync(`.next/${file}`)).length / 1024

const measured = {}
for (const routeKey of Object.keys(pages)) {
  if (!routeKey.endsWith('/page')) continue

  const files = new Set()
  for (const layout of layoutsFor(routeKey)) {
    for (const file of pages[layout] ?? []) files.add(file)
  }
  for (const file of pages[routeKey]) files.add(file)

  measured[routeKey] = Number(
    [...files]
      .filter((file) => file.endsWith('.js'))
      .reduce((total, file) => total + gzipKb(file), 0)
      .toFixed(1),
  )
}

if (isInit) {
  const budgets = Object.fromEntries(
    Object.entries(measured)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([route, kb]) => [route, Math.ceil((kb * HEADROOM) / 5) * 5]),
  )
  writeFileSync(BUDGETS, `${JSON.stringify(budgets, null, 2)}\n`)
  console.log(`[perf:budget] Zapisano baseline (+${Math.round((HEADROOM - 1) * 100)}%) do ${BUDGETS}:`)
  for (const [route, kb] of Object.entries(budgets)) {
    console.log(`  ${route.padEnd(34)} ${String(measured[route]).padStart(7)} kB  ->  limit ${kb} kB`)
  }
  process.exit(0)
}

if (!existsSync(BUDGETS)) {
  console.error(`[perf:budget] Brak ${BUDGETS}. Uruchom \`npm run perf:budget:init\`.`)
  process.exit(1)
}

const budgets = JSON.parse(readFileSync(BUDGETS, 'utf8'))
const rows = []
const offenders = []
const untracked = []

for (const [route, kb] of Object.entries(measured).sort(([a], [b]) => a.localeCompare(b))) {
  const limit = budgets[route]

  if (limit === undefined) {
    untracked.push(route)
    rows.push(`  ?  ${route.padEnd(34)} ${String(kb).padStart(7)} kB   (brak budzetu)`)
    continue
  }

  const over = kb > limit
  if (over) offenders.push({ route, kb, limit })
  rows.push(
    `  ${over ? 'X' : 'v'}  ${route.padEnd(34)} ${String(kb).padStart(7)} kB / ${String(limit).padStart(5)} kB`,
  )
}

console.log('[perf:budget] First Load JS (gzip) per trasa:')
console.log(rows.join('\n'))

if (isReport) process.exit(0)

if (untracked.length > 0) {
  console.error(
    `\n[perf:budget] FAIL. ${untracked.length} nowa trasa bez budzetu. Dodaj wpis do ${BUDGETS}.`,
  )
  process.exit(1)
}

if (offenders.length > 0) {
  console.error(`\n[perf:budget] FAIL. ${offenders.length} trasa(y) ponad budzet:`)
  for (const { route, kb, limit } of offenders) {
    console.error(`  ${route}: ${kb} kB > ${limit} kB (+${(kb - limit).toFixed(1)} kB)`)
  }
  process.exit(1)
}

console.log('\n[perf:budget] OK. Wszystkie trasy w budzecie.')
