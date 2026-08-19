import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 3100)
const BASE_URL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`
const isCI = Boolean(process.env.CI)

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: isCI
    ? [['github'], ['html', { open: 'never', outputFolder: 'e2e/.report' }]]
    : [['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    testIdAttribute: 'data-testid',
    // Chromium koduje nazwe pobieranego pliku w locale procesu. Przy
    // LANG nieustawionym (POSIX/ASCII) nazwa z polskim znakiem — np.
    // "raport_Obecny_miesiąc_….pdf" — cicho degraduje sie do "download",
    // i test eksportu wywalal by sie zaleznie od maszyny, nie od kodu.
    launchOptions: { env: { ...process.env, LANG: 'C.UTF-8' } },
  },

  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/user.json' },
      dependencies: ['setup'],
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], storageState: 'e2e/.auth/user.json' },
      dependencies: ['setup'],
      // Uwaga: testMatch filtruje SCIEZKI PLIKOW. Do tagow w tytulach sluzy grep.
      grep: /@mobile/,
    },
  ],

  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
})
