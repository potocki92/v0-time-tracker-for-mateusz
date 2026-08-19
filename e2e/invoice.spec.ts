import { expect, test, type Page } from '@playwright/test'
import { E2E_CLIENT_NAME } from './fixtures/test-user'

/**
 * Sciezka 3 — wystawienie faktury.
 *
 * Oba testy pisza do tej samej tabeli, ale w rozlaczne obszary numeracji:
 * pierwszy nadaje numer recznie (format spoza serii "FV n/MM/RRRR"), drugi
 * korzysta wylacznie z numerow rezerwowanych przez baze. Dzieki temu moga
 * biec rownolegle, nie zaburzajac sobie sekwencji.
 */

/** Numery z serii nadawanej automatycznie przez `reserve_invoice_sequence`. */
async function autoNumbers(page: Page): Promise<number[]> {
  const rows = await page.getByRole('listitem').allInnerTexts()
  return rows
    .flatMap((row) => [...row.matchAll(/FV (\d+)\/\d{2}\/\d{4}/g)])
    .map((match) => Number(match[1]))
    .sort((a, b) => a - b)
}

test.describe('sciezka 3 — wystawienie faktury', () => {
  test('faktura dla klienta z seeda pojawia sie na liscie', async ({ page }) => {
    // Unikalny numer: indeks (user_id, invoice_number) jest UNIQUE, wiec
    // ponowienie testu nie moze wejsc w konflikt z poprzednim przebiegiem.
    const invoiceNumber = `E2E-${Date.now()}`

    await page.goto('/invoices')
    await page.getByRole('button', { name: 'Nowa faktura' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Nowa faktura' })).toBeVisible()

    // Trigger wyboru klienta nie ma nazwy dostepnosciowej (etykieta "Klient"
    // nie jest z nim zwiazana), wiec wskazujemy go po wlasnej tresci.
    await dialog.getByRole('combobox').filter({ hasText: 'Wybierz klienta' }).click()
    await page.getByRole('option', { name: new RegExp(E2E_CLIENT_NAME) }).click()

    // Wybor klienta wypelnia blok nabywcy — to kontrakt `ClientPickerField`.
    await expect(dialog.getByLabel('Nazwa nabywcy *')).toHaveValue(E2E_CLIENT_NAME)

    await dialog.getByLabel('Numer faktury *').fill(invoiceNumber)
    await dialog.getByLabel('Opis pozycji').fill('Prace programistyczne')
    await dialog.getByLabel('Ilość').fill('10')
    await dialog.getByLabel('Cena jedn. netto').fill('100')

    await dialog.getByRole('button', { name: 'Wystaw fakturę' }).click()
    await expect(dialog).toBeHidden()

    const row = page.getByRole('listitem').filter({ hasText: invoiceNumber })
    await expect(row).toBeVisible()
    await expect(row).toContainText(E2E_CLIENT_NAME)
  })

  test('kolejne faktury dostaja numery bez luk', async ({ page }) => {
    await page.goto('/invoices')

    const issue = async () => {
      await page.getByRole('button', { name: 'Więcej akcji' }).click()
      await page.getByRole('menuitem', { name: /Utwórz testową fakturę/ }).click()
    }

    await issue()
    await expect.poll(() => autoNumbers(page)).toHaveLength(1)
    const [first] = await autoNumbers(page)

    await issue()
    await expect.poll(() => autoNumbers(page)).toHaveLength(2)
    const numbers = await autoNumbers(page)

    // Sedno testu: numeracja jest ciagla. Luka oznacza spalony numer —
    // ksiegowo to blad, nie kosmetyka.
    expect(numbers).toEqual([first, first + 1])
  })
})
