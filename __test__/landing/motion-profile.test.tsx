import { renderToStaticMarkup } from 'react-dom/server'
import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  useMotionProfile,
  usePrefersReducedMotion,
} from '@/app/[locale]/(marketing)/_landing/motion/profile'

/**
 * Landing wybiera profil ruchu po szerokosci okna i po `prefers-reduced-motion`.
 * Obie decyzje sa niedostepne na serwerze, wiec obie musza byc zbudowane tak,
 * zeby PIERWSZY render klienta zgadzal sie z HTML-em z serwera — inaczej
 * dostajemy blad hydratacji, i to akurat u osob z ograniczonym ruchem.
 */

type Listener = () => void

function mockMatchMedia(matches: Record<string, boolean>) {
  const listeners = new Map<string, Set<Listener>>()
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: matches[query] ?? false,
        media: query,
        addEventListener: (_: string, fn: Listener) => {
          if (!listeners.has(query)) listeners.set(query, new Set())
          listeners.get(query)!.add(fn)
        },
        removeEventListener: (_: string, fn: Listener) => listeners.get(query)?.delete(fn),
      }) as unknown as MediaQueryList,
  )
  return {
    set(query: string, value: boolean) {
      matches[query] = value
      act(() => listeners.get(query)?.forEach((fn) => fn()))
    },
  }
}

const DESKTOP = '(min-width: 1024px)'
const REDUCED = '(prefers-reduced-motion: reduce)'

function Profile() {
  return <span data-testid="out">{useMotionProfile()}</span>
}

function Reduced() {
  return <span data-testid="out">{String(usePrefersReducedMotion())}</span>
}

afterEach(() => vi.unstubAllGlobals())

describe('useMotionProfile', () => {
  it('renderuje sie na serwerze bez matchMedia i wybiera lzejszy profil', () => {
    // Nie ma tu zadnego `window` — gdyby hook go dotknal, ten render by wybuchl.
    expect(renderToStaticMarkup(<Profile />)).toContain('mobile')
  })

  it('podnosi profil do desktopu dopiero po hydratacji', () => {
    mockMatchMedia({ [DESKTOP]: true })
    render(<Profile />)
    expect(screen.getByTestId('out').textContent).toBe('desktop')
  })

  it('zostaje na profilu mobilnym ponizej progu', () => {
    mockMatchMedia({ [DESKTOP]: false })
    render(<Profile />)
    expect(screen.getByTestId('out').textContent).toBe('mobile')
  })

  it('reaguje na obrot telefonu i zmiane rozmiaru okna', () => {
    const media = mockMatchMedia({ [DESKTOP]: false })
    render(<Profile />)
    expect(screen.getByTestId('out').textContent).toBe('mobile')
    media.set(DESKTOP, true)
    expect(screen.getByTestId('out').textContent).toBe('desktop')
  })
})

describe('usePrefersReducedMotion', () => {
  it('na serwerze zwraca false, wiec HTML zgadza sie z pierwszym renderem klienta', () => {
    expect(renderToStaticMarkup(<Reduced />)).toContain('false')
  })

  it('wlacza sie po hydratacji, gdy uzytkownik ogranicza ruch', () => {
    mockMatchMedia({ [REDUCED]: true })
    render(<Reduced />)
    expect(screen.getByTestId('out').textContent).toBe('true')
  })

  it('sledzi zmiane ustawienia bez przeladowania strony', () => {
    const media = mockMatchMedia({ [REDUCED]: false })
    render(<Reduced />)
    expect(screen.getByTestId('out').textContent).toBe('false')
    media.set(REDUCED, true)
    expect(screen.getByTestId('out').textContent).toBe('true')
  })
})
