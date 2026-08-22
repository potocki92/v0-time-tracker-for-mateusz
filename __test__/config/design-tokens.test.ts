import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { converter, parse } from 'culori'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const css = readFileSync(resolve(ROOT, 'app/globals.css'), 'utf8')
const toRgb = converter('rgb')

const luminance = (color: string) => {
  const c = toRgb(parse(color))!
  const channel = (x: number) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b)
}

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

function parseThemes() {
  const themes: Record<string, Record<string, string>> = {}
  const add = (name: string, body: string) => {
    const vars = (themes[name] ??= {})
    for (const m of body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim()
  }
  const root = css.match(/:root,\s*\[data-theme='emerald'\]\s*\{([^}]*)\}/)
  if (root) add('emerald-light', root[1])
  for (const b of css.matchAll(/(^|\n)((?:\.dark)?\[data-theme='([a-z]+)'\][^{]*)\{([^}]*)\}/g)) {
    add(`${b[3]}-${b[2].includes('.dark') ? 'dark' : 'light'}`, b[4])
  }
  return themes
}

/** Pary, ktore realnie wystepuja w UI, z progiem WCAG dla kazdej. */
const PAIRS: Array<[string, string, number, string]> = [
  ['foreground', 'background', 4.5, 'tekst podstawowy'],
  ['card-foreground', 'card', 4.5, 'tekst na karcie'],
  ['muted-foreground', 'background', 4.5, 'tekst pomocniczy'],
  ['muted-foreground', 'card', 4.5, 'tekst pomocniczy na karcie'],
  ['primary-foreground', 'primary', 4.5, 'etykieta przycisku primary'],
  ['destructive-foreground', 'destructive', 4.5, 'etykieta przycisku destructive'],
  ['secondary-foreground', 'secondary', 4.5, 'etykieta przycisku secondary'],
  ['accent-foreground', 'accent', 4.5, 'etykieta akcentu'],
  ['sidebar-foreground', 'sidebar', 4.5, 'tekst w sidebarze'],
  ['sidebar-accent-foreground', 'sidebar-accent', 4.5, 'aktywna pozycja sidebara'],
  ['input-border', 'card', 3.0, 'obramowanie pola formularza'],
  ['ring', 'background', 3.0, 'pierscien focus'],
]

const themes = parseThemes()

describe('design tokens — WCAG contrast across every theme', () => {
  it('covers all five palettes in both schemes', () => {
    expect(Object.keys(themes).sort()).toHaveLength(10)
  })

  for (const [name, vars] of Object.entries(themes).sort()) {
    for (const [fg, bg, min, label] of PAIRS) {
      it(`${name}: ${label}`, () => {
        expect(vars[fg], `${name} nie definiuje --${fg}`).toBeDefined()
        expect(vars[bg], `${name} nie definiuje --${bg}`).toBeDefined()
        const value = contrast(vars[fg], vars[bg])
        expect(
          Number(value.toFixed(2)),
          `--${fg} na --${bg} = ${value.toFixed(2)}:1, wymagane ${min}:1`,
        ).toBeGreaterThanOrEqual(min)
      })
    }
  }
})

const SURFACE_STEPS = [
  'surface-0',
  'surface-1',
  'surface-2',
  'surface-3',
  'hairline',
  'hairline-strong',
] as const

describe('design tokens — skala powierzchni panelu', () => {
  it('kazdy motyw definiuje pelna skale', () => {
    for (const [name, vars] of Object.entries(themes)) {
      for (const step of SURFACE_STEPS) {
        expect(vars[step], `${name} nie definiuje --${step}`).toBeDefined()
      }
    }
  })

  it('skala rosnie monotonicznie — kazdy stopien jasniejszy od poprzedniego', () => {
    for (const [name, vars] of Object.entries(themes)) {
      const steps = SURFACE_STEPS.map((s) => [s, luminance(vars[s])] as const)
      for (let i = 1; i < steps.length; i++) {
        expect(
          steps[i][1],
          `${name}: --${steps[i][0]} nie jest jasniejszy niz --${steps[i - 1][0]} — hierarchia glebi sie rozjezdza`,
        ).toBeGreaterThan(steps[i - 1][1])
      }
    }
  })

  it('kontur odroznia sie od powierzchni, ktora obramowuje', () => {
    for (const [name, vars] of Object.entries(themes)) {
      expect(
        Number(contrast(vars['hairline'], vars['surface-1']).toFixed(3)),
        `${name}: kontur na karcie jest niewidoczny`,
      ).toBeGreaterThan(1.15)
      expect(
        Number(contrast(vars['hairline-strong'], vars['surface-2']).toFixed(3)),
        `${name}: kontur hover na kafelku jest niewidoczny`,
      ).toBeGreaterThan(1.2)
    }
  })

  it('biel i zinc-400 zachowuja kontrast AA na kazdym stopniu skali', () => {
    // Tekst na panelu jest jeszcze zahardkodowany (text-white / text-zinc-400).
    // Ten test pilnuje, ze kazdy nowy stopien skali go udzwignie — dzieki temu
    // Etap 1b (migracja tekstu) bedzie podmiana klas, a nie polowaniem na kontrast.
    const WHITE = 'oklch(1 0 0)'
    const ZINC_400 = 'oklch(0.7118 0.0129 286.1)'
    for (const [name, vars] of Object.entries(themes)) {
      for (const step of ['surface-1', 'surface-2', 'surface-3'] as const) {
        expect(
          Number(contrast(WHITE, vars[step]).toFixed(2)),
          `${name}: biel na --${step}`,
        ).toBeGreaterThanOrEqual(4.5)
        expect(
          Number(contrast(ZINC_400, vars[step]).toFixed(2)),
          `${name}: tekst pomocniczy na --${step}`,
        ).toBeGreaterThanOrEqual(4.5)
      }
    }
  })
})

describe('design tokens — the scale is actually used', () => {
  function walk(dir: string, acc: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) walk(full, acc)
      else if (/\.tsx$/.test(entry)) acc.push(relative(ROOT, full))
    }
    return acc
  }

  const components = ['app', 'features', 'components'].flatMap((d) => walk(resolve(ROOT, d)))

  /** Modul palety trzymany w .ts — `walk` zbiera wylacznie .tsx. */
  const SURFACE_TOKEN_MODULES = ['components/ui/tokens.ts']

  it('has no arbitrary font sizes outside the type scale', () => {
    const offenders: string[] = []
    for (const file of components) {
      const hits = readFileSync(resolve(ROOT, file), 'utf8').match(/text-\[[0-9.]+(px|rem)\]/g)
      if (hits) offenders.push(`${file}  (${hits.length}: ${[...new Set(hits)].join(', ')})`)
    }
    expect(
      offenders,
      `uzyj text-2xs..text-h1 zamiast wartosci arbitralnych:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('has no hardcoded rgba shadows — they do not follow the theme', () => {
    const offenders = components.filter((f) =>
      /shadow-\[[^\]]*rgba\(0[,\s]*0[,\s]*0/.test(readFileSync(resolve(ROOT, f), 'utf8')),
    )
    expect(
      offenders,
      `czarny cien znika w dark mode; uzyj shadow-sm..shadow-xl:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('exposes one elevation step per level', () => {
    for (const step of ['xs', 'sm', 'md', 'lg', 'xl']) {
      expect(css, `brak --shadow-${step}`).toContain(`--shadow-${step}:`)
    }
  })

  it('nie hardkoduje powierzchni ani konturow panelu', () => {
    const SURFACE_HEX =
      /\b(?:bg|border|divide|ring)-\[#(?:0a0a0a|0c0c0c|0e0e0e|101012|111|141414|151519|161616|17171a|1a1a1a|1f1f1f|212126|262626|2a2a30)\]/g
    const offenders: string[] = []
    // Paleta panelu mieszka w .ts, wiec `components` (samo .tsx) by jej nie
    // objal — a to wlasnie tam literaly siedzialy najglebiej.
    for (const file of [...components, ...SURFACE_TOKEN_MODULES]) {
      const hits = readFileSync(resolve(ROOT, file), 'utf8').match(SURFACE_HEX)
      if (hits) offenders.push(`${file}  (${[...new Set(hits)].join(', ')})`)
    }
    expect(
      offenders,
      `literal hex omija motyw — uzyj bg-surface-0..3 / border-hairline / border-hairline-strong:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('nie uzywa bg-black w panelu', () => {
    // Landing (app/(marketing)) to osobna strefa wizualna — jego nie dotyczy.
    const offenders = components
      .filter((f) => f.startsWith('features/') || f.startsWith('app/(app)'))
      .filter((f) => /\bbg-black(\/\d+)?\b/.test(readFileSync(resolve(ROOT, f), 'utf8')))
    expect(
      offenders,
      `tlo strony panelu to --surface-0, nie czern absolutna:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('keeps every step of the type scale distinct', () => {
    const steps = [...css.matchAll(/--text-([a-z0-9]+):\s*(clamp\([^;]+\));/g)].map((m) => [
      m[1],
      m[2].replace(/\s+/g, ''),
    ])
    const seen = new Map<string, string>()
    for (const [name, value] of steps) {
      const prev = seen.get(value)
      expect(prev, `--text-${name} ma te sama wartosc co --text-${prev}`).toBeUndefined()
      seen.set(value, name)
    }
  })
})

describe('design tokens — motion respects the user', () => {
  it('kills CSS animation under prefers-reduced-motion', () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
    expect(css).toMatch(/animation-duration:\s*0\.01ms\s*!important/)
  })

  it('routes framer-motion through MotionConfig reducedMotion="user"', () => {
    const provider = readFileSync(resolve(ROOT, 'components/common/motion-provider.tsx'), 'utf8')
    expect(provider).toContain('MotionConfig')
    expect(provider).toContain('reducedMotion="user"')
  })
})
