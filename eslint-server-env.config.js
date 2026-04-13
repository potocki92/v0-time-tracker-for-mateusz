/**
 * Reguła ESLint zapobiegająca importowi serverEnv w Client Components.
 *
 * Problem: developerzy mogą przez pomyłkę zaimportować `serverEnv`
 * w pliku z 'use client' → Next.js bundluje sekrety do bundle przeglądarki.
 *
 * Plik: .eslintrc.js lub eslint.config.mjs
 */

// Dodaj do sekcji `rules` w .eslintrc.js:
module.exports = {
  rules: {
    // Blokuje import serverEnv w plikach zawierających 'use client'
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name:              '@/lib/env',
            importNames:       ['serverEnv'],
            message:
              '❌ serverEnv zawiera sekrety i NIE może być importowany w Client Components. ' +
              'Użyj clientEnv lub przenieś logikę do Server Component / Route Handler.',
          },
        ],
      },
    ],
  },

  overrides: [
    {
      // W plikach Server Components i server utilities — pełny dostęp
      files: [
        'src/app/**/page.tsx',
        'src/app/**/layout.tsx',
        'src/app/api/**/*.ts',
        'src/lib/server/**/*.ts',
        'src/app/**/actions.ts',
        'supabase/functions/**/*.ts',
      ],
      rules: {
        // Wyłącz ograniczenie dla plików które MOGĄ używać serverEnv
        'no-restricted-imports': 'off',
      },
    },
  ],
}

/**
 * Dodaj też do next.config.ts aby dostać błąd przy buildzie:
 *
 * const nextConfig = {
 *   // Importuj env.ts na starcie serwera — fail fast przy złej konfiguracji
 *   serverExternalPackages: [],
 *   async headers() {
 *     // Force env validation at build time
 *     await import('./src/lib/env')
 *     return []
 *   }
 * }
 */