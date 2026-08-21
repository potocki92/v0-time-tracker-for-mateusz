// vitest.config.ts
// Dwa projekty pod jednym `npm run test`:
//   unit       — czysta logika (lib/finance, schematy, konfiguracja) w node,
//   components — komponenty Reacta w jsdom (`*.test.tsx`).
// RLS/integration mieszkaja w vitest.rls.config.ts.
//
// Run:      npm run test
// Watch:    npm run test:watch

import path from 'node:path'
import { defineConfig } from 'vitest/config'

const alias = { '@': path.resolve(__dirname, '.') }

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'unit',
          environment: 'node',
          globals: true,
          include: ['__test__/**/*.test.ts', 'lib/**/__tests__/**/*.test.ts'],
          exclude: ['**/rls.test.ts', '**/*.rls.test.ts', '**/rls/**', 'node_modules/**'],
        },
      },
      {
        resolve: { alias },
        // tsconfig ma `jsx: "preserve"` (wymog Next), wiec transformacje trzeba
        // podac transformerowi Vitesta jawnie — inaczej nie sparsuje `.tsx`.
        oxc: { jsx: { runtime: 'automatic' } },
        test: {
          name: 'components',
          environment: 'jsdom',
          globals: true,
          include: ['components/**/__tests__/**/*.test.tsx'],
          exclude: ['node_modules/**'],
        },
      },
    ],
    reporters: ['verbose'],
  },
})
