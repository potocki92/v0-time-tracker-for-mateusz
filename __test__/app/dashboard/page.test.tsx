import { render as rtlRender, screen, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import common from '@/messages/pl/common.json'
import type { DashboardSectionDef } from '@/features/dashboard/sections/types'
import { DashboardSectionCard } from '@/components/workspace/card/dashboard-section-card'

/**
 * „Dostosuj pulpit" siedzi w stopce sekcji i stoi na `WorkspaceOverlay`,
 * ktory tlumaczy etykiete zamkniecia — bez providera render wywala sie
 * na braku kontekstu i18n.
 */
const render = (ui: React.ReactElement) =>
  rtlRender(
    <NextIntlClientProvider locale="pl" messages={{ common }}>
      {ui}
    </NextIntlClientProvider>,
  )

/**
 * Pulpit renderuje sie z rejestru przepuszczonego przez uklad uzytkownika —
 * nie z recznie wypisanej listy JSX. Rejestr jest tu podmieniony, zeby test
 * pilnowal ZLOZENIA (kolejnosc, widocznosc, przekazanie okresu), a nie tresci
 * prawdziwych kart.
 *
 * Kluczowy kontrakt: o tym, co jest nad zagieciem, decyduje KOLEJNOSC,
 * a nie `tier` z rejestru. Bez tego strzalki w „Dostosuj pulpit" przestawialy
 * sekcje wylacznie w obrebie zwinietej listy i nie zmienialy tego, co widac
 * bez przewijania.
 *
 * Atrapa sekcji stoi na `DashboardSectionCard` — tak samo jak kazda prawdziwa
 * sekcja Pulpitu (pilnuje tego `__test__/config/ui-consistency.test.ts`). To
 * ta karta rysuje naglowek z TYTULEM Z REJESTRU, wiec test kolejnosci moze
 * czytac tytuly wprost z DOM, a nie z propsow.
 */
const section = (
  id: string,
  overrides: Partial<DashboardSectionDef> = {},
): DashboardSectionDef => ({
  id,
  title: id,
  tier: 'secondary',
  respondsToPeriod: true,
  loading: 'eager',
  defaultVisible: true,
  defaultCollapsed: false,
  Component: ({ period }) => (
    <DashboardSectionCard>
      <p>{`${id}:${period}`}</p>
    </DashboardSectionCard>
  ),
  ...overrides,
})

vi.mock('@/features/dashboard/sections/registry', () => ({
  DASHBOARD_SECTIONS: [
    section('hero', { tier: 'hero', respondsToPeriod: false, ownRangeLabel: 'dzisiaj' }),
    section('alfa', { tier: 'primary' }),
    section('beta', { tier: 'primary' }),
    section('gamma', {
      tier: 'primary',
      respondsToPeriod: false,
      ownRangeLabel: 'biezacy tydzien',
    }),
    section('delta', { defaultCollapsed: true }),
    section('epsilon', { tier: 'archive', defaultCollapsed: true }),
  ],
}))

const { DashboardSections } = await import(
  '@/features/dashboard/components/dashboard-sections'
)
const { periodFromRange } = await import('@/features/dashboard/sections/period')
const { useDashboardLayout } = await import(
  '@/features/dashboard/hooks/use-dashboard-layout'
)

const layout = () => useDashboardLayout.getState()

/** Sekcje w kolejnosci renderowania, po tytulach w naglowkach. */
const rendered = () =>
  screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)

const shellOf = (id: string) => document.querySelector(`[data-section-id="${id}"]`)!

beforeEach(() => {
  localStorage.clear()
  layout().resetToDefaults()
})

describe('Pulpit — naglowek jest czescia karty', () => {
  it('tytul sekcji nad zagieciem stoi W SRODKU jej landmarku, nie nad nim', () => {
    // Regresja, ktora to pilnuje: tytul i pigulka zakresu wisialy nad karta
    // jako osobny blok, wiec naglowek byl wizualnie oderwany od tresci,
    // ktora opisuje.
    render(<DashboardSections period="month" />)

    const card = screen.getByRole('region', { name: 'gamma' })
    expect(
      within(card).getByRole('heading', { level: 2 }).textContent,
      'naglowek karty musi byc w jej landmarku',
    ).toBe('gamma')
    expect(within(card).getByText('biezacy tydzien')).toBeDefined()
  })

  it('sekcja rozwinieta w panelu nie dubluje tytulu', () => {
    // W panelu tytul niesie wiersz-przelacznik, wiec karta w srodku ma go
    // NIE powtarzac — inaczej ta sama nazwa czytalaby sie dwa razy.
    render(<DashboardSections period="month" />)

    const headings = screen
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent)
    expect(headings.filter((title) => title === 'delta')).toHaveLength(1)
  })
})

describe('Pulpit — render z rejestru', () => {
  it('renderuje wszystkie widoczne sekcje w kolejnosci ukladu', () => {
    render(<DashboardSections period="month" />)
    expect(rendered()).toEqual(['hero', 'alfa', 'beta', 'gamma', 'delta', 'epsilon'])
  })

  it('nie renderuje sekcji ukrytej', () => {
    layout().toggleVisible('beta')
    render(<DashboardSections period="month" />)

    expect(rendered()).not.toContain('beta')
    expect(screen.queryByText('beta:month')).toBeNull()
  })

  it('kolejnosc uzytkownika decyduje o kolejnosci renderu', () => {
    layout().moveDown('alfa')
    render(<DashboardSections period="month" />)
    expect(rendered()).toEqual(['hero', 'beta', 'alfa', 'gamma', 'delta', 'epsilon'])
  })
})

describe('Pulpit — zagiecie wynika z kolejnosci, nie z rejestru', () => {
  it('pierwsze cztery widoczne sekcje stoja nad zagieciem, bez zwijania', () => {
    render(<DashboardSections period="month" />)

    for (const id of ['hero', 'alfa', 'beta', 'gamma']) {
      expect(
        within(shellOf(id) as HTMLElement).queryByRole('button'),
        `${id} stoi nad zagieciem — nie ma czego zwijac`,
      ).toBeNull()
      expect(screen.getByText(new RegExp(`^${id}:`))).toBeDefined()
    }

    // Pas nad zagieciem to dokladnie trzy karty obok wiodacej.
    expect(document.querySelectorAll('[data-dashboard-primary] > div')).toHaveLength(3)
  })

  it('sekcja spoza zagiecia jest zwinieta i nie montuje zawartosci', () => {
    render(<DashboardSections period="month" />)

    const toggle = within(shellOf('epsilon') as HTMLElement).getByRole('button')
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText('epsilon:month')).toBeNull()
  })

  it('przesuniecie sekcji na gore wprowadza ja nad zagiecie', () => {
    // Sedno zgloszenia: „nie moge dostosowac pulpitu tak, zeby te schowane
    // byly wyzej". Epsilon startuje na koncu, zwiniety.
    for (let i = 0; i < 5; i += 1) layout().moveUp('epsilon')

    render(<DashboardSections period="month" />)

    expect(rendered()[0]).toBe('epsilon')
    expect(
      within(shellOf('epsilon') as HTMLElement).queryByRole('button'),
      'sekcja nad zagieciem nie ma juz przycisku zwijania',
    ).toBeNull()
    expect(screen.getByText('epsilon:month')).toBeDefined()
  })

  it('karta wiodaca zepchnieta w dol trafia do zwijanej listy', () => {
    // „Chcialbym zastapic ten timer czyms innym" — karta „Dzisiaj" nie jest
    // przypieta i moze ustapic miejsca czemus innemu.
    for (let i = 0; i < 5; i += 1) layout().moveDown('hero')

    render(<DashboardSections period="month" />)

    expect(rendered()[0]).toBe('alfa')
    // Zjechala do zwijanej listy, wiec ma przycisk zwijania. Rozwinieta,
    // bo taki ma zapisany stan — zjazd w dol nie jest zwinieciem.
    const toggle = within(shellOf('hero') as HTMLElement).getByRole('button')
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
  })
})

describe('Pulpit — okres', () => {
  it('sekcje reagujace na okres dostaja wybrany okres', () => {
    render(<DashboardSections period="quarter" />)

    expect(screen.getByText('alfa:quarter')).toBeDefined()
    expect(screen.getByText('beta:quarter')).toBeDefined()
  })

  it('sekcja z wlasnym zakresem pokazuje swoj zakres zamiast globalnego', () => {
    render(<DashboardSections period="quarter" />)
    expect(screen.getByText('biezacy tydzien')).toBeDefined()
  })

  it('okres z URL mapuje sie na zakres Pulpitu', () => {
    expect(periodFromRange('current_week')).toBe('week')
    expect(periodFromRange('previous_week')).toBe('week')
    expect(periodFromRange('current_month')).toBe('month')
    expect(periodFromRange('previous_month')).toBe('month')
    expect(periodFromRange('current_quarter')).toBe('quarter')
    expect(periodFromRange('current_year')).toBe('year')
    expect(periodFromRange('all')).toBe('year')
  })

  it('nieznana wartosc w URL nie wywraca Pulpitu — fallback na miesiac', () => {
    // @ts-expect-error — celowo wartosc spoza typu, tak jak w recznie sklejonym URL
    expect(periodFromRange('bzdura')).toBe('month')
    // @ts-expect-error — brak parametru
    expect(periodFromRange(undefined)).toBe('month')
  })
})
