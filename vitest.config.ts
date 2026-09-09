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

const alias = {
  '@': path.resolve(__dirname, '.'),
  // Next podstawia pod `server-only` pusty modul warunkiem `react-server`;
  // poza nim pakiet celowo rzuca. Bez tego aliasu testy nie tkna zadnego
  // modulu `*.server.ts`.
  'server-only': path.resolve(__dirname, 'node_modules/server-only/empty.js'),
  // `next-intl` importuje `next/navigation` jako bare specifier z pliku ESM
  // w node_modules; Vite nie rozwiazuje tam rozszerzenia sam. Alias wskazuje
  // konkretny plik, dzieki czemu `vi.mock('next/navigation')` nadal dziala —
  // mock jest wiazany po rozwiazaniu sciezki.
  'next/navigation': path.resolve(__dirname, 'node_modules/next/navigation.js'),
  'next/server': path.resolve(__dirname, 'node_modules/next/server.js'),
}

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        // Testy jednostkowe siegaja tez po moduly, ktore importuja komponenty
        // (rejestr sekcji Pulpitu trzyma referencje do `.tsx`), wiec
        // transformer musi umiec sparsowac JSX takze w projekcie `unit`.
        oxc: { jsx: { runtime: 'automatic' } },
        test: {
          name: 'unit',
          environment: 'node',
          globals: true,
          // Patrz komentarz przy aliasach: `next-intl` musi przejsc przez Vite,
          // zeby jego importy `next/*` rozwiazaly sie po naszych aliasach.
          server: { deps: { inline: ['next-intl'] } },
          include: ['__test__/**/*.test.ts', 'lib/**/__tests__/**/*.test.ts'],
          exclude: [
            '**/rls.test.ts',
            '**/*.rls.test.ts',
            '**/rls/**',
            'node_modules/**',
            // Hooki klienckie (store ukladu Pulpitu z persist) potrzebuja
            // localStorage — ida do projektu `components`, nie do node.
            '__test__/hooks/**',
          ],
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
          // `next-intl` jest ESM-em w node_modules i importuje `next/navigation`
          // jako bare specifier bez rozszerzenia. Node go nie rozwiaze —
          // dopiero inline przepuszcza pakiet przez Vite, ktory zna alias.
          server: { deps: { inline: ['next-intl'] } },
          include: [
            'components/**/__tests__/**/*.test.tsx',
            '__test__/**/*.test.tsx',
            '__test__/hooks/**/*.test.ts',
          ],
          exclude: ['node_modules/**'],
        },
      },
    ],
    reporters: ['verbose'],
  },
})
