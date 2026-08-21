import { expect, test, type Page } from '@playwright/test'

/**
 * Sciezka 6 — uklad Dashboardu.
 *
 * Regresja, ktora ten plik pilnuje: dashboard nie mial ani jednego breakpointu
 * powyzej `md:`, wiec na 1920 px byl jedna kolumna 15 kart.
 *
 * Asercje na geometrii, nie na klasach — klasa moze byc obecna i nie dzialac.
 */
async function openDashboard(page: Page) {
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

const box = async (page: Page, selector: string) => {
  const b = await page.locator(selector).boundingBox()
  if (!b) throw new Error(`brak elementu ${selector}`)
  return b
}

test('@mobile uklad zostaje jednokolumnowy', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openDashboard(page)

  const main = await box(page, '[data-dashboard-main]')
  const rail = await box(page, '[data-dashboard-rail]')

  expect(rail.y, 'na telefonie szyna ma byc POD kolumna glowna').toBeGreaterThan(
    main.y + main.height - 10,
  )
})

test('na 1440 px szyna stoi obok kolumny glownej', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await openDashboard(page)

  const main = await box(page, '[data-dashboard-main]')
  const rail = await box(page, '[data-dashboard-rail]')

  expect(Math.abs(rail.y - main.y), 'szyna i kolumna glowna zaczynaja sie w tej samej linii')
    .toBeLessThan(8)
  expect(rail.x, 'szyna po prawej od kolumny glownej').toBeGreaterThan(
    main.x + main.width - 10,
  )
  expect(main.width, 'kolumna glowna to ~2x szerokosc szyny').toBeGreaterThan(rail.width * 1.6)
})

test('na 1440 px pas KPI jest trojkolumnowy', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await openDashboard(page)

  const cells = page.locator('[data-dashboard-grid] > .min-w-0')
  const tops: number[] = []
  // Komorki 2, 3 i 4 to pas KPI (pierwsza to Trips).
  for (const i of [1, 2, 3]) {
    const b = await cells.nth(i).boundingBox()
    if (!b) throw new Error(`brak komorki KPI ${i}`)
    tops.push(b.y)
  }
  const spread = Math.max(...tops) - Math.min(...tops)
  expect(spread, 'trzy karty KPI maja stac w jednym rzedzie').toBeLessThan(8)
})

test('szerszy ekran daje krotsza strone', async ({ page }) => {
  const measure = async (w: number) => {
    await page.setViewportSize({ width: w, height: 900 })
    await openDashboard(page)
    return {
      rail: await box(page, '[data-dashboard-rail]'),
      doc: await page.evaluate(() => document.documentElement.scrollHeight),
    }
  }

  // 1024 px: szyna ma jeszcze wlasny wiersz pod kolumna glowna.
  // 1440 px: stoi obok — jej wiersz znika z wysokosci strony.
  const narrow = await measure(1024)
  const wide = await measure(1440)

  expect(wide.doc, 'szerszy ekran nie moze wydluzac strony').toBeLessThan(narrow.doc)

  // Asercja idzie na PIKSELACH, nie na ulamku calosci: oszczednosc jest stala
  // (wysokosc wiersza szyny), a udzial procentowy spada wraz z iloscia danych
  // w kolumnie glownej. Prog na 80% wysokosci szyny zostawia zapas na to,
  // ze przy innej szerokosci kolumna glowna przelamuje sie troche inaczej.
  expect(
    narrow.doc - wide.doc,
    'przy xl: szyna przestaje zajmowac wlasny wiersz — strona ma sie o niego skrocic',
  ).toBeGreaterThan(narrow.rail.height * 0.8)
})
