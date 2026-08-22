import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SectionShell } from '@/features/dashboard/components/section-shell'

/**
 * Skorupa sekcji to test WYDAJNOSCIOWY, nie kosmetyczny: zwinieta sekcja ma
 * NIE ISTNIEC w drzewie Reacta. Ukrycie CSS-em zostawia zamontowany komponent,
 * ktory dalej liczy, subskrybuje store i rysuje wykres.
 *
 * Matchery sa natywne (`toBeDefined` / `getAttribute`) — repo nie ma
 * `@testing-library/jest-dom`, a etap nie dokłada zaleznosci.
 */
function mockReducedMotion(reduced: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? reduced : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

const trigger = () => screen.getByRole('button', { name: /Alfa/ })

const panelOf = (button: HTMLElement) =>
  document.getElementById(button.getAttribute('aria-controls') ?? '')

beforeEach(() => mockReducedMotion(false))
afterEach(() => vi.restoreAllMocks())

describe('SectionShell — montowanie tresci', () => {
  it('nie montuje zawartosci, gdy sekcja jest zwinieta', () => {
    const Content = vi.fn(() => <p>tresc</p>)

    render(
      <SectionShell id="alfa" title="Alfa" collapsed onToggle={vi.fn()}>
        <Content />
      </SectionShell>,
    )

    expect(
      Content,
      'zwinieta sekcja nadal sie renderuje — zwijanie nie daje nic wydajnosciowo',
    ).not.toHaveBeenCalled()
    expect(screen.queryByText('tresc')).toBeNull()
  })

  it('montuje zawartosc po rozwinieciu', () => {
    const Content = vi.fn(() => <p>tresc</p>)
    const props = { id: 'alfa', title: 'Alfa', onToggle: vi.fn() }

    const { rerender } = render(
      <SectionShell {...props} collapsed>
        <Content />
      </SectionShell>,
    )
    rerender(
      <SectionShell {...props} collapsed={false}>
        <Content />
      </SectionShell>,
    )

    expect(Content).toHaveBeenCalled()
    expect(screen.getByText('tresc')).toBeDefined()
  })
})

describe('SectionShell — kotwica dla e2e', () => {
  it('oznacza sekcje atrybutem data-section-id', () => {
    render(
      <SectionShell id="alfa" title="Alfa" collapsed onToggle={vi.fn()}>
        <p>tresc</p>
      </SectionShell>,
    )
    // Po tym atrybucie chodzi `e2e/dashboard-hierarchy.spec.ts` — bez niego
    // testy przegladarkowe wrocilyby do selektorow po klasach.
    expect(document.querySelector('[data-section-id="alfa"]')).not.toBeNull()
  })
})

describe('SectionShell — dostepnosc', () => {
  it('przelacza aria-expanded klinieciem w naglowek', () => {
    const onToggle = vi.fn()
    const props = { id: 'alfa', title: 'Alfa', onToggle }

    const { rerender } = render(
      <SectionShell {...props} collapsed>
        <p>tresc</p>
      </SectionShell>,
    )

    expect(trigger().getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(trigger())
    expect(onToggle).toHaveBeenCalledWith('alfa')

    rerender(
      <SectionShell {...props} collapsed={false}>
        <p>tresc</p>
      </SectionShell>,
    )
    expect(trigger().getAttribute('aria-expanded')).toBe('true')
  })

  it('aria-controls wskazuje istniejacy panel, a panel ma aria-labelledby', () => {
    render(
      <SectionShell id="alfa" title="Alfa" collapsed={false} onToggle={vi.fn()}>
        <p>tresc</p>
      </SectionShell>,
    )

    const button = trigger()
    expect(button.getAttribute('aria-controls'), 'brak aria-controls').toBeTruthy()

    const panel = panelOf(button)
    expect(panel, 'aria-controls wskazuje na nieistniejacy element').not.toBeNull()
    expect(panel!.getAttribute('aria-labelledby')).toBe(button.id)
    expect(button.id, 'przycisk bez id nie moze byc etykieta panelu').toBeTruthy()
  })

  it('dziala z klawiatury — jest natywnym <button>, nie <div role="button">', () => {
    const onToggle = vi.fn()
    render(
      <SectionShell id="alfa" title="Alfa" collapsed onToggle={onToggle}>
        <p>tresc</p>
      </SectionShell>,
    )

    const button = trigger()
    // jsdom nie wykonuje domyslnych akcji klawiszy, wiec `keyDown('Enter')` nie
    // wywolalby `click` nawet na prawidlowym przycisku. Asercja idzie wiec na
    // tym, co obsluge Entera i Spacji GWARANTUJE: natywny, fokusowalny
    // <button> bez recznego tabindexu.
    expect(button.tagName).toBe('BUTTON')
    expect(button.getAttribute('type')).toBe('button')
    expect(button.getAttribute('tabindex')).toBeNull()
    expect(button.hasAttribute('disabled')).toBe(false)

    button.focus()
    expect(document.activeElement).toBe(button)

    fireEvent.click(button)
    expect(onToggle).toHaveBeenCalledWith('alfa')
  })

  it('przycisk ma obszar dotykowy co najmniej 44 px', () => {
    render(
      <SectionShell id="alfa" title="Alfa" collapsed onToggle={vi.fn()}>
        <p>tresc</p>
      </SectionShell>,
    )
    // jsdom nie liczy layoutu — asercja idzie na klasie wysokosci minimalnej.
    expect(trigger().className, 'kciuk nie trafia w 32 px').toMatch(/min-h-\[44px\]/)
  })

  it('pokazuje wlasny zakres sekcji, gdy nie idzie za globalnym okresem', () => {
    render(
      <SectionShell
        id="alfa"
        title="Alfa"
        rangeLabel="biezacy tydzien"
        collapsed={false}
        onToggle={vi.fn()}
      >
        <p>tresc</p>
      </SectionShell>,
    )
    expect(screen.getByText('biezacy tydzien')).toBeDefined()
  })
})

describe('SectionShell — ruch', () => {
  it('pomija animacje wysokosci przy prefers-reduced-motion', () => {
    mockReducedMotion(true)
    render(
      <SectionShell id="alfa" title="Alfa" collapsed={false} onToggle={vi.fn()}>
        <p>tresc</p>
      </SectionShell>,
    )

    expect(
      panelOf(trigger())!.dataset.animated,
      'przy zredukowanym ruchu panel nie moze animowac wysokosci',
    ).toBe('false')
  })

  it('animuje wysokosc, gdy uzytkownik nie prosil o mniej ruchu', () => {
    render(
      <SectionShell id="alfa" title="Alfa" collapsed={false} onToggle={vi.fn()}>
        <p>tresc</p>
      </SectionShell>,
    )
    expect(panelOf(trigger())!.dataset.animated).toBe('true')
  })
})
