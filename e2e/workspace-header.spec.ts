import { expect, test, type Page } from '@playwright/test'
import { WORKSPACE_GROUP_LABELS, WORKSPACE_SECTIONS, sectionHref } from '../lib/workspace/sections'

/**
 * Ujednolicony naglowek obszaru roboczego.
 *
 * Regresja, ktora ten plik pilnuje: breadcrumb `Obszar roboczy › Pulpit` zyl
 * wylacznie na Pulpicie, a pozostale sekcje mialy wlasne, niespojne paski
 * tytulowe. Naglowek jest teraz jeden, w `AppShell`, i musi byc na KAZDEJ
 * trasie panelu — z para grupa/etykieta wprost z rejestru sekcji.
 */
const ROUTED_SECTIONS = WORKSPACE_SECTIONS.filter((section) => section.routed)

/** Bledy konsoli zbierane od pierwszego requestu, nie od momentu asercji. */
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

for (const section of ROUTED_SECTIONS) {
  test(`${sectionHref(section)} ma naglowek obszaru roboczego`, async ({ page }) => {
    const errors = collectConsoleErrors(page)

    await page.goto(sectionHref(section))
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const header = page.getByTestId('workspace-header')
    await expect(header).toBeVisible()

    // Jeden naglowek, nie dwa — stary pasek sekcji musi byc usuniety.
    await expect(page.getByTestId('workspace-header')).toHaveCount(1)
    await expect(page.getByTestId('workspace-breadcrumb')).toHaveCount(1)

    const breadcrumb = page.getByTestId('workspace-breadcrumb')
    await expect(breadcrumb).toContainText(WORKSPACE_GROUP_LABELS[section.group])
    await expect(breadcrumb).toContainText(section.label)

    expect(errors, `bledy konsoli na ${sectionHref(section)}:\n${errors.join('\n')}`).toEqual([])
  })
}

test('naglowek zostaje przyklejony po przewinieciu', async ({ page }) => {
  await page.goto('/projects')
  await expect(page.getByTestId('workspace-header')).toBeVisible()

  const before = await page.getByTestId('workspace-header').boundingBox()
  await page.mouse.wheel(0, 1200)
  await expect(page.getByTestId('workspace-header')).toBeVisible()
  const after = await page.getByTestId('workspace-header').boundingBox()

  expect(before?.y, 'naglowek ma zostac na gorze okna').toBe(after?.y)
  expect(before?.height, 'zmiana wysokosci naglowka przy scrollu to CLS').toBe(after?.height)
})

test('akcja sekcji stoi w naglowku, nie luzem nad trescia', async ({ page }) => {
  await page.goto('/projects')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  const actions = page.getByTestId('workspace-header-actions')
  await expect(actions.getByRole('button', { name: 'Nowy projekt' })).toBeVisible()
})

test('@mobile breadcrumb zwija sie do samej etykiety sekcji', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/clients')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  const breadcrumb = page.getByTestId('workspace-breadcrumb')
  await expect(breadcrumb).toContainText('Klienci')
  await expect(breadcrumb).not.toContainText('Obszar roboczy')

  // Akcje nie moga zawinac sie do drugiej linii — naglowek ma stale 56 px.
  const box = await page.getByTestId('workspace-header').boundingBox()
  expect(box?.height).toBeLessThanOrEqual(57)
})
