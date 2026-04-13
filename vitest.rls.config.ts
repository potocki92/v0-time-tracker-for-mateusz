// vitest.rls.config.ts
// Osobna konfiguracja tylko dla testów RLS — nie miesza z unit testami komponentów.
// Uruchomienie: vitest run --config vitest.rls.config.ts

import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Ładuje .env.test.local — zawiera TEST_USER_A_PASSWORD itd.
  // Ten plik NIE trafia do repozytorium (dodaj do .gitignore)
  const env = loadEnv(mode, process.cwd(), 'TEST_')

  return {
    test: {
      name:        'rls',
      environment: 'node',       // brak DOM — czysty Node, szybszy start
      globals:     true,
      timeout:     15_000,       // Supabase local może być wolniejszy
      hookTimeout: 20_000,
      env,

      // Testy RLS są osobnym suitem — nie mieszaj z unit testami
      include: ['**/*.rls.test.ts', '**/rls/**/*.test.ts'],

      // Sekwencyjnie — unikamy race conditions przy tworzeniu fixtures
      pool:        'forks',
      poolOptions: { forks: { singleFork: true } },

      reporters: ['verbose'],
    },
  }
})