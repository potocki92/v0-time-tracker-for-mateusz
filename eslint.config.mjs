import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'
import tseslint from 'typescript-eslint'

const __dirname = dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({ baseDirectory: __dirname })

/**
 * Granice modulow (Etap 3).
 * Publiczne wejscia feature'a to dokladnie trzy:
 *   '@/features/<x>'        — API klienckie
 *   '@/features/<x>/domain' — czysta logika i typy, bez Reacta
 *   '@/features/<x>/server' — server-only
 * Wszystko glebiej jest prywatne.
 */
const moduleBoundaries = {
  group: ['@/features/*/*', '@/features/*/*/**', '!@/features/*/domain', '!@/features/*/server'],
  message:
    "Import przez publiczne API modulu: '@/features/<x>', '@/features/<x>/domain' albo '@/features/<x>/server'. Brakuje symbolu? Dodaj go do index.ts tego modulu zamiast siegac do srodka.",
}

const serverEnvOnly = {
  name: '@/lib/env',
  importNames: ['serverEnv'],
  message:
    'serverEnv zawiera sekrety i nie moze trafic do Client Component. Uzyj clientEnv albo przenies logike na serwer.',
}

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
      'no-restricted-imports': ['error', { patterns: [moduleBoundaries], paths: [serverEnvOnly] }],
    },
  },

  // Testy jednostkowe sprawdzaja wnetrze modulow — to ich zadanie.
  {
    files: ['__test__/**/*.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': 'off' },
  },

  // Konteksty serwerowe: serverEnv dozwolony, granice modulow NADAL obowiazuja.
  {
    files: ['app/**/route.ts', 'app/**/_actions/**/*.ts', '**/*.server.ts', 'middleware.ts', 'lib/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [moduleBoundaries] }],
    },
  },
)
