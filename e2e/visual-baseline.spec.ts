import { expect, test } from '@playwright/test'

/**
 * TYMCZASOWY — usuwany w KROKU 6.
 *
 * Etap 1 tokenizacji powierzchni ma byc wizualnie neutralny w motywie
 * emerald/dark. Ten spec robi zdjecia PRZED migracja i porownuje PO,
 * zeby "neutralny" bylo stwierdzeniem, a nie nadzieja.
 */
const ROUTES = ['/dashboard', '/calendar', '/clients', '/invoices', '/projects', '/reports'] as const

for (const route of ROUTES) {
  test(`snapshot ${route}`, async ({ page }) => {
    await page.goto(route)
    // Nie czekamy na <h1>: /projects i /invoices go nie maja (nagłowek modulu
    // jest w app-shellu). Landmark <main> jest na kazdej trasie — first(),
    // bo /dashboard zagniezdza wlasny <main> w tym z AppShell.
    await expect(page.getByRole('main').first()).toBeVisible()
    // Wykresy recharts animuja sie po zamontowaniu — czekamy na stan koncowy,
    // nie na staly timeout (zabroniony przez __test__/config/e2e-suite.test.ts).
    await expect(page.locator('[data-testid="section-skeleton"]')).toHaveCount(0)
    await expect(page).toHaveScreenshot(`${route.slice(1)}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.002,
      animations: 'disabled',
    })
  })
}
