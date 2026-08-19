import { expect, test as setup } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { E2E_USER, STORAGE_STATE } from './fixtures/test-user'

/**
 * Loguje sie raz i zapisuje ciasteczka do pliku. Kazdy kolejny test startuje
 * juz zalogowany, wiec logowanie nie jest w krytycznej sciezce 30 razy.
 */
setup('authenticate', async ({ page }) => {
  await page.goto('/auth/login')

  // `exact: true` jest tu konieczne: przelacznik widocznosci hasla ma
  // aria-label "Pokaz haslo", wiec dopasowanie po fragmencie zlapaloby
  // dwa elementy i wywrocilo sie na strict mode.
  await page.getByLabel('Email', { exact: true }).fill(E2E_USER.email)
  await page.getByLabel('Hasło', { exact: true }).fill(E2E_USER.password)
  await page.getByRole('button', { name: 'Zaloguj się' }).click()

  await page.waitForURL('**/dashboard')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await page.context().storageState({ path: STORAGE_STATE })
  expect(JSON.parse(readFileSync(STORAGE_STATE, 'utf8')).cookies.length).toBeGreaterThan(0)
})
