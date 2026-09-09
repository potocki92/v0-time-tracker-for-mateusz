import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import navigation from '@/messages/pl/navigation.json'

/**
 * Przelacznik jezyka ma trzy obowiazki, ktorych nie widac na screenshocie:
 * zostac na tej samej stronie, zapisac wybor i nie zgubic query stringa.
 */
const nav = vi.hoisted(() => ({
  pathname: '/dashboard',
  search: '',
  replace: vi.fn(),
  saved: [] as string[],
}))

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useSearchParams: () => new URLSearchParams(nav.search),
}))

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: nav.replace }),
}))

vi.mock('@/i18n/actions', () => ({
  setPreferredLocaleAction: vi.fn(async (locale: string) => {
    nav.saved.push(locale)
  }),
}))

const { LocaleSwitcher } = await import('@/components/i18n/locale-switcher')

function renderSwitcher(locale: 'pl' | 'de' | 'en' = 'pl') {
  return render(
    <NextIntlClientProvider locale={locale} messages={{ navigation }}>
      <LocaleSwitcher />
    </NextIntlClientProvider>,
  )
}

beforeEach(() => {
  nav.pathname = '/dashboard'
  nav.search = ''
  nav.replace.mockClear()
  nav.saved = []
})

describe('LocaleSwitcher — dostepnosc', () => {
  it('jest grupa z nazwa, a nie samymi flagami', () => {
    renderSwitcher()
    expect(screen.getByRole('group', { name: navigation.localeSwitcher.label })).toBeDefined()
  })

  it('kazdy jezyk jest przyciskiem osiagalnym z klawiatury', () => {
    renderSwitcher()
    for (const code of ['PL', 'DE', 'EN']) {
      expect(screen.getByRole('button', { name: new RegExp(code) })).toBeDefined()
    }
  })

  it('pelna nazwa jezyka jedzie do czytnika ekranu', () => {
    renderSwitcher()
    for (const name of ['Polski', 'Deutsch', 'English']) {
      expect(screen.getByText(name)).toBeDefined()
    }
  })

  it('oznacza aktywny jezyk przez aria-current', () => {
    renderSwitcher('de')
    const active = screen.getByRole('button', { name: /DE/ })
    expect(active.getAttribute('aria-current')).toBe('true')
    expect(screen.getByRole('button', { name: /PL/ }).getAttribute('aria-current')).toBeNull()
  })
})

describe('LocaleSwitcher — zachowanie', () => {
  it('zostaje na tej samej stronie, nie wyrzuca na strone glowna', async () => {
    renderSwitcher()
    fireEvent.click(screen.getByRole('button', { name: /DE/ }))

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/dashboard', { locale: 'de' }))
  })

  it('zachowuje query string', async () => {
    nav.search = 'range=current_week'
    renderSwitcher()
    fireEvent.click(screen.getByRole('button', { name: /EN/ }))

    await waitFor(() =>
      expect(nav.replace).toHaveBeenCalledWith('/dashboard?range=current_week', { locale: 'en' }),
    )
  })

  it('zapisuje wybor, zanim przejdzie na nowy adres', async () => {
    renderSwitcher()
    fireEvent.click(screen.getByRole('button', { name: /DE/ }))

    await waitFor(() => expect(nav.saved).toEqual(['de']))
  })

  it('klikniecie w aktywny jezyk nic nie robi', async () => {
    renderSwitcher('pl')
    fireEvent.click(screen.getByRole('button', { name: /PL/ }))

    await waitFor(() => expect(nav.replace).not.toHaveBeenCalled())
    expect(nav.saved).toEqual([])
  })
})
