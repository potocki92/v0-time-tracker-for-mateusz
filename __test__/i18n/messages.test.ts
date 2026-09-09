import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { APP_LOCALES, DEFAULT_LOCALE } from '@/i18n/config'
import { MESSAGE_NAMESPACES } from '@/i18n/messages'

/**
 * Brakujace tlumaczenie nie moze cicho pojawic sie w produkcji jako
 * `marketing.hero.title`.
 *
 * Ten plik jest siatka bezpieczenstwa dla calego procesu tlumaczen: dopisanie
 * klucza w PL bez odpowiednika w DE/EN zapala CI, zanim ktokolwiek zobaczy
 * sciezke klucza na ekranie.
 */
const ROOT = path.resolve(__dirname, '../..')
const MESSAGES = path.join(ROOT, 'messages')

type Json = Record<string, unknown>

function readNamespace(locale: string, namespace: string): Json {
  return JSON.parse(readFileSync(path.join(MESSAGES, locale, `${namespace}.json`), 'utf8'))
}

/** Plaska lista sciezek kluczy, np. `hero.title`. */
function keyPaths(node: unknown, prefix = ''): string[] {
  if (typeof node !== 'object' || node === null || Array.isArray(node)) return [prefix]
  return Object.entries(node as Json).flatMap(([key, value]) =>
    keyPaths(value, prefix ? `${prefix}.${key}` : key),
  )
}

/** Nazwy zmiennych ICU uzyte w komunikacie, bez skladni plural/select. */
function placeholders(message: string): string[] {
  return [...new Set([...message.matchAll(/\{\s*([A-Za-z0-9_]+)/g)].map((m) => m[1]))]
    .filter((name) => !['plural', 'select', 'selectordinal'].includes(name))
    .sort()
}

function leafMessages(node: unknown, prefix = '', out: Map<string, string> = new Map()) {
  if (typeof node === 'string') {
    out.set(prefix, node)
    return out
  }
  if (typeof node === 'object' && node !== null) {
    for (const [key, value] of Object.entries(node as Json)) {
      leafMessages(value, prefix ? `${prefix}.${key}` : key, out)
    }
  }
  return out
}

describe('messages — komplet plikow', () => {
  it('kazdy jezyk ma dokladnie te same przestrzenie nazw', () => {
    for (const locale of APP_LOCALES) {
      const files = readdirSync(path.join(MESSAGES, locale))
        .filter((file) => file.endsWith('.json'))
        .map((file) => file.replace(/\.json$/, ''))
        .sort()

      expect(files, `messages/${locale}`).toEqual([...MESSAGE_NAMESPACES].sort())
    }
  })
})

describe('messages — identyczne drzewo kluczy', () => {
  for (const namespace of MESSAGE_NAMESPACES) {
    it(`${namespace}: DE i EN maja komplet kluczy z PL`, () => {
      const base = keyPaths(readNamespace(DEFAULT_LOCALE, namespace)).sort()

      for (const locale of APP_LOCALES.filter((l) => l !== DEFAULT_LOCALE)) {
        const other = keyPaths(readNamespace(locale, namespace)).sort()

        const missing = base.filter((key) => !other.includes(key))
        const extra = other.filter((key) => !base.includes(key))

        expect(missing, `brakuje w ${locale}/${namespace}`).toEqual([])
        expect(extra, `nadmiarowe w ${locale}/${namespace}`).toEqual([])
      }
    })
  }
})

describe('messages — spojnosc parametrow ICU', () => {
  for (const namespace of MESSAGE_NAMESPACES) {
    it(`${namespace}: te same zmienne we wszystkich jezykach`, () => {
      const base = leafMessages(readNamespace(DEFAULT_LOCALE, namespace))
      const mismatches: string[] = []

      for (const locale of APP_LOCALES.filter((l) => l !== DEFAULT_LOCALE)) {
        const other = leafMessages(readNamespace(locale, namespace))
        for (const [key, message] of base) {
          const translated = other.get(key)
          if (translated === undefined) continue
          const expected = placeholders(message)
          const actual = placeholders(translated)
          if (expected.join(',') !== actual.join(',')) {
            mismatches.push(`${locale}/${namespace}:${key} — ${expected} vs ${actual}`)
          }
        }
      }

      expect(
        mismatches,
        `komunikat bez parametru renderuje sie jako pusta dziura:\n${mismatches.join('\n')}`,
      ).toEqual([])
    })
  }
})

describe('messages — brak pustych i podejrzanych wartosci', () => {
  it('zaden komunikat nie jest pusty', () => {
    const empty: string[] = []
    for (const locale of APP_LOCALES) {
      for (const namespace of MESSAGE_NAMESPACES) {
        for (const [key, value] of leafMessages(readNamespace(locale, namespace))) {
          if (value.trim() === '') empty.push(`${locale}/${namespace}:${key}`)
        }
      }
    }
    expect(empty).toEqual([])
  })

  it('DE i EN nie zostawiaja polskich znakow diakrytycznych', () => {
    // Najtanszy wykrywacz „zapomnialem przetlumaczyc": polska diakrytyka
    // w pliku niemieckim albo angielskim to prawie zawsze kopiuj-wklej z PL.
    const offenders: string[] = []
    for (const locale of ['de', 'en'] as const) {
      for (const namespace of MESSAGE_NAMESPACES) {
        for (const [key, value] of leafMessages(readNamespace(locale, namespace))) {
          if (/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(value)) offenders.push(`${locale}/${namespace}:${key} — ${value}`)
        }
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([])
  })
})
