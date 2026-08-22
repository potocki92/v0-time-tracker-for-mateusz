import { expect, test, type Page } from '@playwright/test'

/**
 * Regresja, ktora ten plik pilnuje: sekcja Klienci miala wlasny przyklejony
 * pasek (tytul + licznik + wyszukiwarka + filtry), dublujacy breadcrumb w
 * gornym pasku i toolbar tabeli. Pasek zostal usuniety — a wraz z nim NIE
 * moga zniknac: akcja „Dodaj klienta" (portal do gornego paska) ani h1.
 */
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

test('pasek sekcji zniknal, gorny pasek zostal', async ({ page }) => {
  const errors = collectConsoleErrors(page)
  await page.goto('/clients')

  const heading = page.getByRole('heading', { level: 1, name: 'Klienci' })
  await expect(heading).toHaveClass(/sr-only/)

  await expect(
    page.getByPlaceholder('Szukaj po nazwie, mieście, telefonie...'),
  ).toHaveCount(0)

  await expect(page.getByTestId('workspace-header')).toBeVisible()
  await expect(page.getByTestId('workspace-breadcrumb')).toContainText('Klienci')

  expect(errors, `bledy konsoli na /clients:\n${errors.join('\n')}`).toEqual([])
})

test('„Dodaj klienta" przezylo usuniecie paska i otwiera formularz', async ({ page }) => {
  await page.goto('/clients')

  const action = page.getByTestId('workspace-header-actions')
    .getByRole('button', { name: 'Dodaj klienta' })
  await expect(action).toBeVisible()

  await action.click()
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('tresc startuje od razu pod gornym paskiem', async ({ page }) => {
  await page.goto('/clients')
  await expect(page.getByTestId('workspace-header')).toBeVisible()

  // Pierwszy realny element tresci ma stac tuz pod paskiem (57 px), a nie
  // ~180 px nizej, jak przy dodatkowym pasku sekcji.
  const first = page.locator('main *:visible').first()
  const box = await first.boundingBox()
  expect(box?.y ?? 0, 'nad trescia zostal drugi pasek').toBeLessThan(140)
})

test('wyszukiwanie i filtry zyja w tabeli (desktop)', async ({ page }) => {
  await page.goto('/clients')
  await expect(
    page.getByPlaceholder('Szukaj klientów po nazwie, mieście, e-mailu...'),
  ).toBeVisible()
})

test('@mobile filtry zyja na liscie mobilnej', async ({ page }) => {
  // Projekt `chromium` nie filtruje po tagach i uruchamia rowniez ten test,
  // a lista mobilna renderuje sie dopiero ponizej 768 px. Viewport ustawiony
  // jawnie — tak samo jak w pozostalych testach @mobile w tym repo.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/clients')
  await expect(page.getByRole('heading', { level: 1, name: 'Klienci' })).toBeAttached()
  await expect(page.getByRole('button', { name: /Filtruj/ })).toBeVisible()
})
