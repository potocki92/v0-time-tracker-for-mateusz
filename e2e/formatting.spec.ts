import { expect, test, type Page } from '@playwright/test'

/**
 * Sciezka 12 — warstwa formatowania (Etap 2).
 *
 * Regresje, ktore ten plik pilnuje:
 *  - siatka kalendarza pokazywala etykiety z innego miesiaca niz wybrany
 *    ("GRU · SO 12" przy wpisach sierpniowych),
 *  - stawka efektywna bez godzin rozliczalnych renderowala sie jako
 *    "0,00 EUR/h" zamiast placeholdera braku danych,
 *  - puste albo zle sparsowane wartosci wyciekaly jako "NaN",
 *    "Invalid Date" i "undefined",
 *  - godziny mialy kropke dziesietna ("240.0h") obok kwot z przecinkiem.
 *
 * Asercje ida po WIDOCZNYM tekscie strony, nie po propsach komponentow —
 * dokladnie po tym, co widzi uzytkownik na zrzucie ekranu.
 */

const FORBIDDEN = ['NaN', 'Invalid Date', 'undefined', '0,00 EUR/h', '0,00 zł/h']

async function visibleText(page: Page): Promise<string> {
  // Intl wstawia NBSP — normalizujemy, zeby asercje czytaly sie jak tekst.
  return (await page.locator('body').innerText()).replace(/[  ]/g, ' ')
}

for (const [name, path] of [
  ['Pulpit', '/dashboard'],
  ['Kalendarz', '/calendar'],
] as const) {
  test(`${name}: zaden widoczny tekst nie jest uszkodzona wartoscia`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const text = await visibleText(page)
    for (const needle of FORBIDDEN) {
      expect(text, `${name} renderuje "${needle}"`).not.toContain(needle)
    }
  })

  test(`${name}: godziny maja przecinek dziesietny, nie kropke`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const text = await visibleText(page)
    expect(text, `${name} renderuje godziny z kropka dziesietna`).not.toMatch(
      /\d+\.\d+\s*h\b/,
    )
  })
}

test('Kalendarz: siatka nie wychodzi poza wybrany miesiac i jego dopelnienie', async ({
  page,
}) => {
  await page.goto('/calendar')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  const ids = await page.locator('[data-testid^="day-cell-"]').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('data-testid')!.replace('day-cell-', '')),
  )
  expect(ids.length, 'siatka kalendarza nie wyrenderowala zadnego dnia').toBeGreaterThan(27)

  // Miesiac ma najwyzej trzy klucze "YYYY-MM": dopelnienie z tylu, wybrany
  // miesiac, dopelnienie z przodu. Czwarty klucz albo dziura w numeracji
  // oznacza, ze ktorys dzien policzyl sie na zlym obiekcie Date.
  const months = [...new Set(ids.map((iso) => iso.slice(0, 7)))].sort()
  expect(months.length, `siatka obejmuje miesiace ${months.join(', ')}`).toBeLessThanOrEqual(3)

  const asIndex = (key: string) => Number(key.slice(0, 4)) * 12 + Number(key.slice(5, 7))
  expect(
    asIndex(months[months.length - 1]) - asIndex(months[0]),
    `miesiace siatki nie sa kolejne: ${months.join(', ')}`,
  ).toBe(months.length - 1)
})
