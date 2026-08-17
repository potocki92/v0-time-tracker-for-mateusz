import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'
import tseslint from 'typescript-eslint'

const __dirname = dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({ baseDirectory: __dirname })

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'coverage/**',
      'mobile/**',
      'public/**',
      'next-env.d.ts',
    ],
  },

  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  ...tseslint.configs.recommended,

  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      // serverEnv zawiera sekrety — import w Client Component wrzuca je do bundle przegladarki.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/lib/env',
              importNames: ['serverEnv'],
              message:
                'serverEnv zawiera sekrety i nie moze trafic do Client Component. Uzyj clientEnv albo przenies logike na serwer.',
            },
          ],
        },
      ],
    },
  },

  // Konteksty serwerowe maja pelny dostep do serverEnv.
  {
    files: [
      'app/**/page.tsx',
      'app/**/layout.tsx',
      'app/**/route.ts',
      'app/**/_actions/**/*.ts',
      '**/*.server.ts',
      'middleware.ts',
      'lib/**/*.ts',
    ],
    rules: { 'no-restricted-imports': 'off' },
  },
)
