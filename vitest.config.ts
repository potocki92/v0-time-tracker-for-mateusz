// vitest.config.ts
// Unit tests for pure library code (lib/finance, schemas, utilities).
// RLS/integration tests live under vitest.rls.config.ts.
//
// Run:      pnpm vitest run
// Watch:    pnpm vitest

import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    name: 'unit',
    environment: 'node',
    globals: true,
    include: ['__test__/**/*.test.ts', 'lib/**/__tests__/**/*.test.ts'],
    exclude: ['**/rls.test.ts', '**/*.rls.test.ts', '**/rls/**', 'node_modules/**'],
    reporters: ['verbose'],
  },
})
