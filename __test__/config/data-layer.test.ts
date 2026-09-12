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

const dataFiles = walk(resolve(ROOT, 'features'))
  .concat(walk(resolve(ROOT, 'app')))
  .filter((f) => /fetchers|service|\.server\.ts$/.test(f))

describe('data layer — no blanket selects', () => {
  it('never selects every column from a table', () => {
    const offenders = dataFiles.filter((f) => /select\(\s*['"]\*['"]\s*\)/.test(read(f)))
    expect(
      offenders,
      `select('*') ciagnie wszystkie kolumny; wypisz je jawnie:\n${offenders.join('\n')}`,
    ).toEqual([])
  })
})

describe('data layer — every list query is bounded', () => {
  const UNBOUNDED = /\.from\((['"])(work_entries|invoices|clients|projects|invoice_line_items)\1\)/

  it('pairs each unbounded table read with a limit, range or aggregate', () => {
    const offenders: string[] = []
    for (const file of dataFiles) {
      const src = read(file)
      if (!UNBOUNDED.test(src)) continue
      const bounded = /\.limit\(|\.range\(|\.single\(|\.maybeSingle\(|\.rpc\(|count:/.test(src)
      if (!bounded) offenders.push(file)
    }
    expect(
      offenders,
      `odczyt tabeli bez limit/range/agregatu — rosnie liniowo z historia:\n${offenders.join('\n')}`,
    ).toEqual([])
  })
})

describe('data layer — migrations', () => {
  const files = readdirSync(resolve(ROOT, 'supabase/migrations')).filter((f) => f.endsWith('.sql'))

  /**
   * Migracje przeniesione 1:1 z `scripts/`. Definiuja funkcje, ktore albo MUSZA
   * byc `security definer` (trigger na `auth.users`, rezerwacja numeracji,
   * cron lecacy bez sesji uzytkownika), albo istnialy przed wprowadzeniem tej
   * reguly. Zmiana ich trybu tutaj rozjechalaby swiezo zresetowana baze
   * z produkcja, gdzie te funkcje juz dzialaja — dlatego reguła obowiazuje
   * kazda NOWA funkcje, a te sa wypisane imiennie.
   */
  const LEGACY_FUNCTION_MIGRATIONS = new Set([
    'profile_trigger',
    'work_entries_rate_snapshot',
    'invoice_sequence_reservation',
    'invoice_status_enum',
    'invoice_line_items',
    'recurring_invoices',
  ])

  const isLegacy = (file: string) =>
    LEGACY_FUNCTION_MIGRATIONS.has(file.replace(/^\d{14}_/, '').replace(/\.sql$/, ''))

  it('has no duplicate version prefixes', () => {
    const prefixes = files.map((f) => f.split('_')[0])
    const dupes = prefixes.filter((p, i) => prefixes.indexOf(p) !== i)
    expect(dupes, `kolidujace wersje migracji: ${[...new Set(dupes)].join(', ')}`).toEqual([])
  })

  it('uses Supabase CLI timestamps, not hand-rolled counters', () => {
    for (const file of files) {
      expect(file, `${file} — uzyj \`supabase migration new\``).toMatch(/^\d{14}_/)
    }
  })

  /**
   * Komentarze w migracjach opisuja te reguly dokladnie tymi slowami, ktore
   * test wyszukuje („`security definer` byloby tu bledem…"). Skan patrzy
   * wiec wylacznie na kod.
   */
  const stripComments = (sql: string) =>
    sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')

  it('pins search_path and explicit rights on every function it defines', () => {
    for (const file of files) {
      if (isLegacy(file)) continue
      const sql = stripComments(read(join('supabase/migrations', file)))
      if (!/create\s+(or\s+replace\s+)?function/i.test(sql)) continue

      expect(sql, `${file}: brak \`set search_path\``).toMatch(/set\s+search_path\s*=/i)

      // Tryb uprawnien musi byc JAWNY — milczenie znaczy „nikt nie zdecydowal".
      expect(sql, `${file}: brak \`security invoker\` / \`security definer\``).toMatch(
        /security\s+(invoker|definer)/i,
      )

      // `security definer` jest dopuszczalne tylko tam, gdzie funkcja naprawde
      // potrzebuje praw wlasciciela (scheduler automatu pracy czyta sekret
      // z Vault, czego wolajacy nie odszyfruje) — i wtedy MUSI miec odebrane
      // `execute` dla `public`. Inaczej kazda sesja, takze `anon`, wykonuje ja
      // z tymi prawami.
      if (/security\s+definer/i.test(sql)) {
        expect(
          sql,
          `${file}: \`security definer\` bez \`revoke ... on function ... from public\``,
        ).toMatch(/revoke\s+(all|execute)[^;]*?on\s+function[^;]*?from\s+public/i)
      }
    }
  })

  it('keeps the legacy allowlist honest — every entry still exists and still defines a function', () => {
    const names = files.map((f) => f.replace(/^\d{14}_/, '').replace(/\.sql$/, ''))
    for (const legacy of LEGACY_FUNCTION_MIGRATIONS) {
      expect(names, `${legacy} nie istnieje juz w supabase/migrations — usun go z allowlisty`).toContain(legacy)
      const file = files.find((f) => f.endsWith(`_${legacy}.sql`))!
      expect(
        read(join('supabase/migrations', file)),
        `${legacy} nie definiuje juz funkcji — usun go z allowlisty`,
      ).toMatch(/create\s+(or\s+replace\s+)?function/i)
    }
  })
})
