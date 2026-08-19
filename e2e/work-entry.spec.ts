import { expect, test, type Page } from '@playwright/test'
import { E2E_CLIENT_NAME } from './fixtures/test-user'

/**
 * Sciezka 2 — zapis czasu pracy.
 *
 * Kalendarz startuje na biezacym miesiacu, wiec obie daty ponizej sa zawsze
 * widoczne bez nawigacji. Dzien 1. nigdy nie jest data przyszla, wiec dialog
 * otwiera sie w trybie "realnym" ze statusem "Pracowałem".
 */
function dayOfCurrentMonth(day: number): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${String(day).padStart(2, '0')}`
}

const SAVE_DATE = dayOfCurrentMonth(1)
const EMPTY_FORM_DATE = dayOfCurrentMonth(2)
const HOURS = '7.5'

async function openDay(page: Page, date: string) {
  await page.goto('/calendar')
  await page.getByTestId(`day-cell-${date}`).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  return dialog
}

test.describe('sciezka 2 — wpis czasu pracy', () => {
  test('wpis dodany w formularzu przezywa przeladowanie strony', async ({ page }) => {
    const dialog = await openDay(page, SAVE_DATE)

    await dialog.getByTestId('entry-client-select').click()
    await page.getByRole('option', { name: new RegExp(E2E_CLIENT_NAME) }).click()

    // Pole godzin pojawia sie dopiero po wybraniu klienta rozliczanego godzinowo.
    const hoursInput = dialog.getByRole('spinbutton')
    await expect(hoursInput).toBeVisible()
    await hoursInput.fill(HOURS)

    await dialog.getByRole('button', { name: 'Zapisz' }).click()
    await expect(dialog).toBeHidden()

    // Sedno testu: przeladowanie omija cache Reacta, wiec wpis moze byc
    // widoczny tylko wtedy, gdy naprawde zapisal sie w bazie.
    await page.reload()
    await expect(page.getByTestId(`day-cell-${SAVE_DATE}`)).toContainText(/7[.,]5\s*h/)
  })

  test('nie pozwala zapisac wpisu bez klienta', async ({ page }) => {
    const dialog = await openDay(page, EMPTY_FORM_DATE)

    const save = dialog.getByRole('button', { name: 'Zapisz' })
    await expect(save).toBeDisabled()
    // Komunikat, ktory mowi czego brakuje — formularz startuje z pustym
    // wyborem klienta i sam to nazywa.
    await expect(dialog.getByText('Wybierz klienta…')).toBeVisible()

    // Kontrola negatywna: blokada wynika z braku klienta, a nie z tego, ze
    // przycisk jest wylaczony na stale.
    await dialog.getByTestId('entry-client-select').click()
    await page.getByRole('option', { name: new RegExp(E2E_CLIENT_NAME) }).click()
    await expect(save).toBeEnabled()
  })
})
