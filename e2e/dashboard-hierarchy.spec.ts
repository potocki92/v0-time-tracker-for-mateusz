import { expect, test, type Page } from '@playwright/test'

/**
 * Sciezka 7 — hierarchia Pulpitu.
 *
 * Regresja, ktora ten plik pilnuje: Pulpit byl pietnastoma sekcjami o tej samej
 * wadze wizualnej, montowanymi naraz — okolo osmiu ekranow przewijania na
 * telefonie, przy czym najczestsza czynnosc (sprawdzenie „co z dzisiaj")
 * wymagala scrollowania.
 *
 * Asercje na geometrii i na DOM, nie na klasach.
 */
test.use({ viewport: { width: 390, height: 844 } })

/**
 * Kontrakt kompletnosci: te id musza byc osiagalne po refaktorze — albo
 * widoczne na Pulpicie, albo do wlaczenia w „Dostosuj pulpit". Lista jest
 * kopia inwentaryzacji z rejestru; rozjazd z rejestrem lapie
 * `__test__/features/dashboard/registry.test.ts`.
 */
const SECTION_IDS = [
  'trips',
  'activity',
  'projects-schedule',
  'invoices',
  'weekly-accounting-summary',
  'activity-analysis',
  'quarters',
  'year-heatmap',
  'upcoming',
  'effective-rate',
  'quick-actions',
] as const

async function openDashboard(page: Page) {
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

test('@mobile budzet przewijania: Pulpit miesci sie w czterech ekranach', async ({ page }) => {
  await openDashboard(page)

  const { scroll, viewport } = await page.evaluate(() => ({
    scroll: document.body.scrollHeight,
    viewport: window.innerHeight,
  }))

  expect(
    scroll / viewport,
    `Pulpit ma ${(scroll / viewport).toFixed(1)} ekranu — przed refaktorem okolo 8`,
  ).toBeLessThan(4)
})

test('@mobile pierwszy ekran odpowiada „co z dzisiaj" bez przewijania', async ({ page }) => {
  await openDashboard(page)

  const hero = page.getByRole('region', { name: 'Dzisiaj' })
  await expect(hero).toBeVisible()

  const action = hero.getByRole('link', { name: /Dodaj dziś/ })
  await expect(action).toBeVisible()

  const box = await action.boundingBox()
  expect(box, 'brak akcji glownej').not.toBeNull()
  expect(
    box!.y + box!.height,
    'akcja glowna musi byc nad zagieciem — po to powstalo hero',
  ).toBeLessThan(844)
})

test('@mobile sekcja archiwalna nie jest w DOM, dopoki jest zwinieta', async ({ page }) => {
  await openDashboard(page)

  const quarters = page.locator('[data-section-id="quarters"]')
  await expect(quarters).toBeVisible()

  const toggle = quarters.getByRole('button', { name: /Kwartały/ })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(
    quarters.getByRole('region', { name: 'Kwartały' }),
    'zwinieta sekcja nadal montuje swoja karte — zwijanie nie daje nic wydajnosciowo',
  ).toHaveCount(0)

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(quarters.getByRole('region', { name: 'Kwartały' })).toBeVisible()
})

test('@mobile stan zwiniecia przezywa przeladowanie strony', async ({ page }) => {
  await openDashboard(page)

  const invoices = page.locator('[data-section-id="invoices"]')
  const toggle = invoices.getByRole('button', { name: /Faktury/ })

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')

  await page.reload()

  const afterReload = page
    .locator('[data-section-id="invoices"]')
    .getByRole('button', { name: /Faktury/ })
  await expect(
    afterReload,
    'uklad ma przezyc przeladowanie — po to jest persist w use-dashboard-layout',
  ).toHaveAttribute('aria-expanded', 'true')
})

test('@mobile zmiana okresu idzie do URL, a wstecz przywraca poprzedni', async ({ page }) => {
  await openDashboard(page)

  await page.getByRole('tab', { name: 'Kwartał' }).click()
  await expect(page).toHaveURL(/range=current_quarter/)

  await page.getByRole('tab', { name: 'Tydzień' }).click()
  await expect(page).toHaveURL(/range=current_week/)

  await page.goBack()
  await expect(
    page,
    'okres w URL bez wpisu w historii = przycisk wstecz wyrzuca z Pulpitu',
  ).toHaveURL(/range=current_quarter/)
  await expect(page.getByRole('tab', { name: 'Kwartał' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
})

test('@mobile zero regresji funkcji: kazda sekcja jest osiagalna', async ({ page }) => {
  await openDashboard(page)

  await page.getByRole('button', { name: 'Dostosuj pulpit' }).click()
  const sheet = page.getByRole('dialog')
  await expect(sheet).toBeVisible()

  for (const id of SECTION_IDS) {
    const row = sheet.locator(`[data-section-id="${id}"]`)
    await expect(row, `sekcja ${id} wypadla z Pulpitu`).toHaveCount(1)
  }
})

test('@mobile ukryta sekcja znika z Pulpitu i wraca po ponownym wlaczeniu', async ({ page }) => {
  await openDashboard(page)

  await page.getByRole('button', { name: 'Dostosuj pulpit' }).click()
  const sheet = page.getByRole('dialog')
  const row = sheet.locator('[data-section-id="upcoming"]')

  await row.getByRole('switch').click()
  await page.keyboard.press('Escape')
  await expect(sheet).toBeHidden()
  await expect(page.locator('[data-section-id="upcoming"]')).toHaveCount(0)

  await page.getByRole('button', { name: 'Dostosuj pulpit' }).click()
  await page.getByRole('dialog').locator('[data-section-id="upcoming"]').getByRole('switch').click()
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-section-id="upcoming"]')).toHaveCount(1)
})
