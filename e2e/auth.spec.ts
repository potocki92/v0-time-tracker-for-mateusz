import { expect, test } from '@playwright/test'
import { E2E_USER } from './fixtures/test-user'

test.describe('sciezka 1 — logowanie', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('odrzuca zle haslo bez przekierowania', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email', { exact: true }).fill(E2E_USER.email)
    await page.getByLabel('Hasło', { exact: true }).fill('zdecydowanie-nieprawidlowe')
    await page.getByRole('button', { name: 'Zaloguj się' }).click()

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('nie wpuszcza na dashboard bez sesji', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})

test.describe('sciezka 1 — sesja', () => {
  test('trzyma sesje po odswiezeniu @mobile', async ({ page }) => {
    await page.goto('/dashboard')
    await page.reload()
    await expect(page).toHaveURL(/\/dashboard/)
  })
})
