import { readFileSync, statSync } from 'node:fs'
import { expect, test } from '@playwright/test'

/**
 * Sciezka 4 — eksport PDF.
 *
 * Generator PDF wjezdza przez `dynamic import` w `hooks/useExportData.ts`.
 * Sam fakt pobrania pliku niczego nie dowodzi — gdyby lazy chunk sie nie
 * doladowal, przegladarka zapisalaby pusty albo uciety plik. Dlatego
 * sprawdzamy naglowek %PDF- i rozmiar.
 */
test.describe('sciezka 4 — eksport PDF', () => {
  test('pobiera raport, ktory naprawde jest plikiem PDF', async ({ page }) => {
    await page.goto('/dashboard')

    await page.getByRole('button', { name: 'Opcje karty Zarobki' }).click()
    // Radix otwiera podmenu na hover — klikniecie w trigger tylko je przelacza.
    await page.getByRole('menuitem', { name: /Eksportuj raport/ }).hover()

    // Nazwa dostepnosciowa pozycji zawiera skrot klawiszowy ("PDF ⌘P").
    const pdfItem = page.getByRole('menuitem', { name: /^PDF/ })
    await expect(pdfItem).toBeVisible()

    const downloadPromise = page.waitForEvent('download')
    await pdfItem.click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/\.pdf$/)

    const path = await download.path()
    expect(statSync(path).size).toBeGreaterThan(1024)
    expect(readFileSync(path).subarray(0, 5).toString('latin1')).toBe('%PDF-')
  })
})
