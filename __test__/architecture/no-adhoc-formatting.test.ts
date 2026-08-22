import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Granica warstw: `lib/metrics` zwraca liczby, `lib/format` zwraca stringi,
 * warstwa widoku nie robi ani arytmetyki, ani formatowania.
 *
 * Ten test ma failować przy KAŻDYM nawrocie do formatowania w komponencie —
 * to on utrzymuje jedno źródło prawdy dla "18 200,00 zł", "240 h" i "SIE".
 */

const ROOT = path.resolve(__dirname, '../..')
const SCANNED = ['app', 'components', 'hooks', 'features']

/**
 * `lib/format` to jedyna warstwa, która ma prawo wołać Intl.
 *
 * Landing marketingowy jest wyjęty świadomie: nie renderuje danych aplikacji,
 * tylko statyczne liczby z projektu graficznego (animowany licznik `CountUp`
 * odtwarza format literału, który dostał — łącznie z lokalizacją en-US).
 */
const ALLOWED = ['lib/format', 'app/(marketing)']

const RULES: Array<{ name: string; pattern: RegExp }> = [
  { name: 'toLocaleDateString', pattern: /\.toLocaleDateString\s*\(/ },
  { name: 'toLocaleTimeString', pattern: /\.toLocaleTimeString\s*\(/ },
  { name: 'toLocaleString', pattern: /\.toLocaleString\s*\(/ },
  { name: 'Intl.*', pattern: /\bIntl\.(NumberFormat|DateTimeFormat|RelativeTimeFormat|PluralRules|ListFormat)\b/ },
  { name: 'toFixed', pattern: /\.toFixed\s*\(/ },
  {
    name: 'hardkodowana tablica miesięcy',
    pattern:
      /['"`](?:sty|lut|mar|kwi|maj|cze|lip|sie|wrz|paź|paz|lis|gru)[a-ząćęłńóśźż]*['"`]\s*,\s*['"`](?:sty|lut|mar|kwi|maj|cze|lip|sie|wrz|paź|paz|lis|gru)[a-ząćęłńóśźż]*['"`]/i,
  },
]

function sourceFiles(dir: string): string[] {
  const absolute = path.join(ROOT, dir)
  const found: string[] = []
  for (const entry of readdirSync(absolute)) {
    const full = path.join(absolute, entry)
    if (statSync(full).isDirectory()) {
      found.push(...sourceFiles(path.join(dir, entry)))
    } else if (/\.tsx?$/.test(entry)) {
      found.push(path.join(dir, entry))
    }
  }
  return found
}

function violations(): string[] {
  const found: string[] = []
  for (const dir of SCANNED) {
    for (const file of sourceFiles(dir)) {
      if (ALLOWED.some((allowed) => file.startsWith(allowed))) continue
      const lines = readFileSync(path.join(ROOT, file), 'utf8').split('\n')
      lines.forEach((line, index) => {
        // Komentarze opisuja te reguly — skan patrzy wylacznie na kod.
        if (/^\s*(\/\/|\/?\*)/.test(line)) return
        for (const rule of RULES) {
          if (rule.pattern.test(line)) {
            found.push(`${file}:${index + 1} — ${rule.name}`)
          }
        }
      })
    }
  }
  return found
}

describe('warstwa widoku nie formatuje samodzielnie', () => {
  it('nie ma ad-hoc formatowania poza lib/format', () => {
    expect(violations()).toEqual([])
  })
})
