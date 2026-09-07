import { expect, test, type Page } from '@playwright/test'

/**
 * Sciezka 6 — uklad Pulpitu na szerokim ekranie.
 *
 * Do etapu „hierarchia Pulpitu" ten plik pilnowal siatki 12-kolumnowej
 * z przyklejona szyna. Uklad jest teraz warstwowy (hero, pas trzech kart,
 * lista zwinietych sekcji), wiec kontrakt jest inny — ale sedno regresji
 * zostaje to samo: Pulpit nie moze byc jedna kolumna kart na 1920 px,
 * a podmiana skeletonu na tresc nie moze przesuwac ukladu.
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

test('@mobile pas nad zagieciem zostaje jednokolumnowy', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openDashboard(page)

  const cells = page.locator('[data-dashboard-primary] > div')
  await expect(cells).toHaveCount(3)

  const tops: number[] = []
  for (let i = 0; i < 3; i += 1) {
    const b = await cells.nth(i).boundingBox()
    if (!b) throw new Error(`brak karty ${i}`)
    tops.push(b.y)
  }
  expect(
    Math.max(...tops) - Math.min(...tops),
    'na telefonie trzy karty KPI maja stac jedna pod druga',
  ).toBeGreaterThan(0)
})

test('na 1440 px pas nad zagieciem jest trojkolumnowy', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await openDashboard(page)

  const cells = page.locator('[data-dashboard-primary] > div')
  await expect(cells).toHaveCount(3)

  const tops: number[] = []
  for (let i = 0; i < 3; i += 1) {
    const b = await cells.nth(i).boundingBox()
    if (!b) throw new Error(`brak karty KPI ${i}`)
    tops.push(b.y)
  }
  expect(
    Math.max(...tops) - Math.min(...tops),
    'trzy karty KPI maja stac w jednym rzedzie',
  ).toBeLessThan(8)
})

test('szerszy ekran daje krotsza strone', async ({ page }) => {
  const measure = async (w: number) => {
    await page.setViewportSize({ width: w, height: 900 })
    await openDashboard(page)
    return {
      primary: await box(page, '[data-dashboard-primary]'),
      doc: await page.evaluate(() => document.documentElement.scrollHeight),
    }
  }

  // 390 px: trzy karty pasa stoja jedna pod druga.
  // 1440 px: stoja obok siebie — dwa ich wiersze znikaja z wysokosci strony.
  const narrow = await measure(390)
  const wide = await measure(1440)

  expect(wide.doc, 'szerszy ekran nie moze wydluzac strony').toBeLessThan(narrow.doc)
  expect(
    narrow.doc - wide.doc,
    'przy lg: pas KPI przestaje zajmowac trzy wiersze — strona ma sie o nie skrocic',
  ).toBeGreaterThan(wide.primary.height)
})

test('podmiana skeletonu nie przesuwa ukladu', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await openDashboard(page)

  const cls = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean }
            if (!shift.hadRecentInput) total += shift.value
          }
          // `buffered: true` dorzuca przesuniecia sprzed zalozenia obserwatora,
          // czyli te z podmiany skeletonu na tresc — o nie tu chodzi.
        }).observe({ type: 'layout-shift', buffered: true })

        // Okno obserwacji zyje w KONTEKSCIE STRONY, nie w spec'u:
        // __test__/config/e2e-suite.test.ts sluszne blokuje page.waitForTimeout,
        // bo to zrodlo flaków. Tu nie ma na co czekac przez expect — CLS to
        // wielkosc zbierana w czasie, nie stan, ktory kiedys nastapi.
        setTimeout(() => resolve(total), 2500)
      }),
  )

  expect(cls, `CLS ${cls.toFixed(4)} — prog "dobry" wg Core Web Vitals to 0.1`).toBeLessThan(0.1)
})
