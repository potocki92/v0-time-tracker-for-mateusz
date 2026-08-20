import { expect, test, type Page } from '@playwright/test'

/**
 * Sciezka 5 — nawigacja miedzy sekcjami panelu.
 *
 * Regresja, ktora ten plik pilnuje: bez `experimental.staleTimes` w
 * next.config.mjs Next 15 nie cache’uje segmentow dynamicznych, wiec powrot
 * na odwiedzona przed chwila sekcje robil pelny round-trip RSC i pokazywal
 * skeleton od nowa.
 *
 * Asercja jest liczona na zadaniach, nie na czasie — czas jest flaky na CI.
 * Zadania RSC rozpoznajemy po parametrze `_rsc`; prefetch odfiltrowujemy
 * naglowkiem `next-router-prefetch`, bo prefetch jest pozadany i nie blokuje UI.
 */
function trackRscNavigations(page: Page): string[] {
  const paths: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (!url.searchParams.has('_rsc')) return
    if (request.headers()['next-router-prefetch'] === '1') return
    paths.push(url.pathname)
  })
  return paths
}

async function clickNav(page: Page, name: RegExp) {
  await page.getByRole('link', { name }).first().click()
}

test.describe('sciezka 5 — nawigacja panelu', () => {
  test('powrot na odwiedzona sekcje nie robi ponownego zadania RSC', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Licznik startuje dopiero po rozgrzaniu /dashboard — interesuje nas
    // wylacznie POWROT, nie pierwsze wejscie.
    const rscPaths = trackRscNavigations(page)

    await clickNav(page, /Kalendarz/i)
    await page.waitForURL('**/calendar')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await clickNav(page, /Dashboard|Pulpit/i)
    await page.waitForURL('**/dashboard')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    expect(
      rscPaths.filter((p) => p === '/dashboard'),
      'powrot na /dashboard poszedl po dane do serwera — Router Cache nie dziala',
    ).toEqual([])
  })

  test('powrot na odwiedzona sekcje nie pokazuje skeletonu', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await clickNav(page, /Kalendarz/i)
    await page.waitForURL('**/calendar')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    let skeletonSeen = false
    const watcher = page
      .getByTestId('section-skeleton')
      .first()
      .waitFor({ state: 'visible', timeout: 2_000 })
      .then(() => { skeletonSeen = true })
      .catch(() => { /* skeleton sie nie pojawil — to jest oczekiwany wynik */ })

    await clickNav(page, /Dashboard|Pulpit/i)
    await page.waitForURL('**/dashboard')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await watcher

    expect(skeletonSeen, 'skeleton na powrocie = uzytkownik czeka na dane, ktore juz ma').toBe(false)
  })

  test('@mobile dolna nawigacja tez korzysta z Router Cache', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const rscPaths = trackRscNavigations(page)

    const nav = page.getByRole('navigation', { name: 'Nawigacja główna' })
    await nav.getByRole('link', { name: /Kalendarz/i }).click()
    await page.waitForURL('**/calendar')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await nav.getByRole('link', { name: /Dashboard|Pulpit/i }).click()
    await page.waitForURL('**/dashboard')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    expect(rscPaths.filter((p) => p === '/dashboard')).toEqual([])
  })
})
