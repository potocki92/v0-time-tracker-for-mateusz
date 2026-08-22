import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { WORKSPACE_SECTIONS, sectionHref } from '../lib/workspace/sections'

/**
 * Zrzuty ekranu wszystkich sekcji panelu w dwoch viewportach — material do
 * przegladu wizualnego, nie asercja. Kazdy przebieg nadpisuje ten sam plik,
 * wiec `git diff` na `docs/screenshots/` pokazuje, co realnie zmienil sie w UI.
 *
 * Determinizm: zegar zamrozony (powitanie i daty zaleza od godziny), animacje
 * i przejscia wyzerowane, czekanie na `networkidle` zamiast na staly timeout.
 */
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
] as const

const ROUTED_SECTIONS = WORKSPACE_SECTIONS.filter((section) => section.routed)

const OUTPUT_ROOT = resolve(process.cwd(), 'docs/screenshots')

/** Data zamrozona na sztywno — inaczej kazdy przebieg daje inny zrzut. */
const FROZEN_CLOCK = new Date('2026-03-17T09:30:00.000Z')

async function freeze(page: Page) {
  await page.clock.install({ time: FROZEN_CLOCK })
  await page.emulateMedia({ reducedMotion: 'reduce' })
}

async function stopAnimations(page: Page) {
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
      caret-color: transparent !important;
    }`,
  })
}

for (const viewport of VIEWPORTS) {
  test.describe(`zrzuty — ${viewport.name}`, () => {
    for (const section of ROUTED_SECTIONS) {
      test(`${viewport.name} · ${section.segment}`, async ({ page }) => {
        await mkdir(resolve(OUTPUT_ROOT, viewport.name), { recursive: true })

        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await freeze(page)

        await page.goto(sectionHref(section))
        await expect(page.getByTestId('workspace-header')).toBeVisible()
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await page.waitForLoadState('networkidle')
        await stopAnimations(page)

        await page.screenshot({
          path: resolve(OUTPUT_ROOT, viewport.name, `${section.segment}.png`),
          fullPage: true,
        })
      })
    }
  })
}
