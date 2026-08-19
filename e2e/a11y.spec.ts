import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * Etap 6 sprawdzil tokeny (kontrast policzony ze zmiennych CSS).
 * To sprawdza gotowy DOM: nazwy dostepne, etykiety pol, kolejnosc naglowkow,
 * kontrast po zlozeniu warstw.
 */
const ROUTES = ['/dashboard', '/calendar', '/clients', '/invoices'] as const

const scan = (page: Page) =>
  new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

for (const route of ROUTES) {
  test(`${route} nie ma naruszen WCAG AA`, async ({ page }) => {
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const { violations } = await scan(page)

    const summary = violations
      .map((v) => `${v.id} (${v.impact}) — ${v.nodes.length}x\n    ${v.helpUrl}`)
      .join('\n  ')

    expect(violations, `naruszenia na ${route}:\n  ${summary}`).toEqual([])
  })
}

test('formularz logowania jest obslugiwalny z klawiatury', async ({ page }) => {
  await page.context().clearCookies()
  await page.goto('/auth/login')

  // Pierwszy Tab trafia w skip-link z `app/layout.tsx`, dopiero drugi w pole email.
  // Przelacznik widocznosci hasla ma `tabIndex={-1}`, wiec nie wchodzi w kolejnosc.
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Email', { exact: true })).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Hasło', { exact: true })).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Zaloguj się' })).toBeFocused()
})
