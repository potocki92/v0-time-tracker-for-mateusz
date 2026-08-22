import { expect, test, type Page } from '@playwright/test'

/**
 * Regresja, ktora ten plik pilnuje: kazda sekcja miala wlasna implementacje
 * tych samych elementow — akcja glowna w Klientach byla shadcnowym `Button`,
 * a w Projektach i Fakturach recznie sklejonym `<button>` z inna wysokoscia,
 * promieniem i kolorem. Test porownuje policzone style, nie klasy.
 */
const STYLE_KEYS = [
  'backgroundColor',
  'color',
  'height',
  'borderRadius',
  'fontSize',
  'fontWeight',
] as const

async function computed(page: Page, selector: string) {
  const el = page.locator(selector).first()
  await expect(el).toBeVisible()
  return el.evaluate((node, keys) => {
    const style = getComputedStyle(node as Element)
    return Object.fromEntries(keys.map((k) => [k, style.getPropertyValue(k) || (style as any)[k]]))
  }, STYLE_KEYS as unknown as string[])
}

const ACTIONS = [
  { path: '/clients',  name: 'Dodaj klienta' },
  { path: '/projects', name: 'Nowy projekt' },
  { path: '/invoices', name: 'Nowa faktura' },
] as const

test('akcja glowna wyglada identycznie w kazdej sekcji', async ({ page }) => {
  const styles: Record<string, unknown> = {}

  for (const action of ACTIONS) {
    await page.goto(action.path)
    const button = page.getByRole('button', { name: action.name }).first()
    await expect(button).toBeVisible()
    styles[action.path] = await button.evaluate((node, keys) => {
      const style = getComputedStyle(node as Element)
      return Object.fromEntries(keys.map((k) => [k, (style as any)[k]]))
    }, STYLE_KEYS as unknown as string[])
  }

  expect(styles['/projects'], 'Projekty maja inny przycisk niz Klienci').toEqual(styles['/clients'])
  expect(styles['/invoices'], 'Faktury maja inny przycisk niz Klienci').toEqual(styles['/clients'])
})

test('kafelki KPI maja jedna geometrie', async ({ page }) => {
  const tiles: Record<string, unknown> = {}

  for (const path of ['/clients', '/projects', '/invoices'] as const) {
    await page.goto(path)
    tiles[path] = await computed(page, '[data-slot="stat-tile"]')
  }

  expect(tiles['/projects']).toEqual(tiles['/clients'])
  expect(tiles['/invoices']).toEqual(tiles['/clients'])
})

test('sekcje uzywaja wspolnego kontenera', async ({ page }) => {
  for (const path of ['/clients', '/projects', '/invoices', '/reports', '/calendar'] as const) {
    await page.goto(path)
    await expect(
      page.locator('[data-slot="page-container"]'),
      `${path} nie uzywa PageContainer`,
    ).toHaveCount(1)
  }
})

test('@mobile akcja glowna nie zawija paska', async ({ page }) => {
  for (const action of ACTIONS) {
    await page.goto(action.path)
    await expect(page.getByRole('button', { name: action.name }).first()).toBeVisible()
    const box = await page.getByTestId('workspace-header').boundingBox()
    expect(box?.height, `pasek na ${action.path} urosl — akcja sie zawija`).toBeLessThanOrEqual(57)
  }
})
