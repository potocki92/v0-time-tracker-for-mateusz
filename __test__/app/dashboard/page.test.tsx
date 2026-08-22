import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardSectionDef } from '@/features/dashboard/sections/types'

/**
 * Pulpit renderuje sie z rejestru przepuszczonego przez uklad uzytkownika —
 * nie z recznie wypisanej listy JSX. Rejestr jest tu podmieniony, zeby test
 * pilnowal ZLOZENIA (kolejnosc, widocznosc, przekazanie okresu), a nie tresci
 * prawdziwych kart.
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
  Component: ({ period }) => <p>{`${id}:${period}`}</p>,
  ...overrides,
})

vi.mock('@/features/dashboard/sections/registry', () => ({
  DASHBOARD_SECTIONS: [
    section('hero', { tier: 'hero', respondsToPeriod: false, ownRangeLabel: 'dzisiaj' }),
    section('alfa'),
    section('beta'),
    section('gamma', {
      respondsToPeriod: false,
      ownRangeLabel: 'biezacy tydzien',
    }),
  ],
}))

const { DashboardSections } = await import(
  '@/features/dashboard/components/dashboard-sections'
)
const { periodFromRange } = await import('@/features/dashboard/sections/period')
const { useDashboardLayout } = await import(
  '@/features/dashboard/hooks/use-dashboard-layout'
)

beforeEach(() => {
  useDashboardLayout.getState().resetToDefaults()
})

describe('Pulpit — render z rejestru', () => {
  it('renderuje sekcje w kolejnosci z ukladu uzytkownika', () => {
    useDashboardLayout.getState().moveDown('alfa')

    render(<DashboardSections period="month" />)

    const rendered = screen
      .getAllByRole('heading', { level: 2 })
      .map((h) => h.textContent)
    expect(rendered).toEqual(['beta', 'alfa', 'gamma'])
  })

  it('nie renderuje sekcji ukrytej', () => {
    useDashboardLayout.getState().toggleVisible('beta')

    render(<DashboardSections period="month" />)

    expect(screen.queryByRole('heading', { level: 2, name: 'beta' })).toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: 'alfa' })).toBeDefined()
  })

  it('hero renderuje sie poza lista zwijanych sekcji', () => {
    render(<DashboardSections period="month" />)

    // Hero nie ma przycisku zwijania — ma byc zawsze widoczne.
    expect(screen.getByText('hero:month')).toBeDefined()
    expect(screen.queryByRole('button', { name: /hero/ })).toBeNull()
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
