import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  WORKSPACE_GROUP_LABELS,
  WORKSPACE_SECTIONS,
  sectionHref,
} from '@/lib/workspace/sections'
import { useTimerStore } from '@/hooks/stores/useTimerStore'
import { WorkspaceHeader } from '../workspace-header'
import {
  WorkspaceHeaderActions,
  WorkspaceHeaderSlotProvider,
} from '../workspace-header-slot'

/**
 * `usePathname` jest jedynym wejsciem naglowka — sterujemy nim per test.
 * Reszta (rejestr sekcji, store licznika) to prawdziwe implementacje: test ma
 * pilnowac zachowania zlozenia, nie tego, ze mocki zwracaja to, co im kazano.
 */
const pathname = vi.hoisted(() => ({ current: '/dashboard' }))

vi.mock('next/navigation', () => ({
  usePathname: () => pathname.current,
}))

function renderHeader(path: string, children?: ReactNode) {
  pathname.current = path
  return render(
    <WorkspaceHeaderSlotProvider>
      <WorkspaceHeader />
      {children}
    </WorkspaceHeaderSlotProvider>,
  )
}

const breadcrumb = () => screen.getByTestId('workspace-breadcrumb')

beforeEach(() => {
  useTimerStore.setState({ running: false, baseSeconds: 0, startedAt: null })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('WorkspaceHeader — breadcrumb', () => {
  const routed = WORKSPACE_SECTIONS.filter((section) => section.routed)

  it('rejestr ma jakies trasy do sprawdzenia', () => {
    expect(routed.length).toBeGreaterThan(0)
  })

  it.each(routed.map((section) => [section.segment, section] as const))(
    '/%s pokazuje pare grupa › sekcja',
    (_segment, section) => {
      renderHeader(sectionHref(section))

      const crumb = breadcrumb()
      expect(within(crumb).getByText(WORKSPACE_GROUP_LABELS[section.group])).toBeDefined()
      expect(within(crumb).getByText(section.label)).toBeDefined()
    },
  )

  it('oznacza biezaca sekcje jako aktywna', () => {
    renderHeader('/projects')

    const current = within(breadcrumb()).getByText('Projekty')
    expect(current.getAttribute('aria-current')).toBe('page')
  })

  it('trasa zagniezdzona ma trzy czlony, z nazwa encji na koncu', () => {
    renderHeader('/projects/Flensburg')

    const crumb = breadcrumb()
    expect(within(crumb).getByText('Obszar roboczy')).toBeDefined()
    expect(within(crumb).getByText('Projekty')).toBeDefined()

    const leaf = within(crumb).getByText('Flensburg')
    expect(leaf.getAttribute('aria-current')).toBe('page')
    // Na trasie zagniezdzonej to sekcja przestaje byc elementem biezacym.
    expect(within(crumb).getByText('Projekty').getAttribute('aria-current')).toBeNull()
  })

  it('sekcja bez wlasnej trasy nie trafia do breadcrumba', () => {
    // `#goals` to pozycja zapowiedziana w sidebarze — nie ma strony `/goals`.
    renderHeader('/goals')

    expect(breadcrumb().textContent).toBe('')
  })
})

describe('WorkspaceHeader — slot akcji strony', () => {
  it('renderuje dziecko wewnatrz kontenera akcji', () => {
    renderHeader(
      '/projects',
      <WorkspaceHeaderActions>
        <button type="button">Nowy projekt</button>
      </WorkspaceHeaderActions>,
    )

    const slot = screen.getByTestId('workspace-header-actions')
    expect(within(slot).getByRole('button', { name: 'Nowy projekt' })).toBeDefined()
  })

  it('zostaje pusty, gdy strona nie ma akcji', () => {
    renderHeader('/calendar')

    expect(screen.getByTestId('workspace-header-actions').childElementCount).toBe(0)
  })
})

describe('WorkspaceHeader — powiadomienia', () => {
  it('dzwonek ma dostepna nazwe', () => {
    renderHeader('/dashboard')

    expect(screen.getByRole('button', { name: 'Powiadomienia' })).toBeDefined()
  })
})

describe('WorkspaceHeader — licznik czasu', () => {
  it('stoi na Play, dopoki store nie leci', () => {
    renderHeader('/dashboard')

    expect(screen.getByRole('button', { name: 'Uruchom śledzenie' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Zatrzymaj śledzenie' })).toBeNull()
  })

  it('przechodzi w Stop, gdy store leci', () => {
    useTimerStore.setState({ running: true, baseSeconds: 0, startedAt: Date.now() })
    renderHeader('/dashboard')

    const stop = screen.getByRole('button', { name: 'Zatrzymaj śledzenie' })
    expect(stop.getAttribute('aria-pressed')).toBe('true')
    expect(screen.queryByRole('button', { name: 'Uruchom śledzenie' })).toBeNull()
  })

  it('pokazuje licznik mm:ss liczony od startu', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-21T10:00:00Z'))
    const startedAt = Date.now() - 95_000

    useTimerStore.setState({ running: true, baseSeconds: 0, startedAt })
    renderHeader('/dashboard')

    expect(screen.getByText('01:35')).toBeDefined()
  })

  it('nie pokazuje licznika, gdy stoi', () => {
    renderHeader('/dashboard')

    expect(screen.queryByText(/^\d{2}:\d{2}$/)).toBeNull()
  })
})
