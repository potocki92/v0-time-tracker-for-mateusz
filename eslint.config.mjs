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

/**
 * Formatowanie (Etap 2).
 * Jedna warstwa zamienia liczby i daty na tekst: lib/format. Poza nia Intl
 * jest zablokowany, bo rozjezdzal sie miedzy komponentami — "240.0h" obok
 * "18 200,00 zl", "W33" obok "KW 34/2026", grudniowe etykiety przy
 * sierpniowych wpisach.
 */
const FORMATTING_MESSAGE = 'Uzyj lib/format'

const noAdhocFormatting = [
  {
    selector:
      "MemberExpression[property.name=/^toLocale(Date|Time)?String$/]",
    message: FORMATTING_MESSAGE,
  },
  {
    selector:
      "NewExpression[callee.object.name='Intl'][callee.property.name=/^(NumberFormat|DateTimeFormat|RelativeTimeFormat|PluralRules|ListFormat)$/]",
    message: FORMATTING_MESSAGE,
  },
  {
    selector:
      "CallExpression[callee.object.name='Intl'][callee.property.name=/^(NumberFormat|DateTimeFormat|RelativeTimeFormat|PluralRules|ListFormat)$/]",
    message: FORMATTING_MESSAGE,
  },
]

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
      'no-restricted-syntax': ['error', ...noAdhocFormatting],
      'no-restricted-properties': [
        'error',
        { object: 'Intl', property: 'NumberFormat', message: FORMATTING_MESSAGE },
        { object: 'Intl', property: 'DateTimeFormat', message: FORMATTING_MESSAGE },
        { object: 'Intl', property: 'RelativeTimeFormat', message: FORMATTING_MESSAGE },
        { object: 'Intl', property: 'PluralRules', message: FORMATTING_MESSAGE },
      ],
    },
  },

  // Warstwa formatowania to jedyne miejsce, ktore ma prawo wolac Intl.
  // Landing marketingowy nie renderuje danych aplikacji, tylko statyczne
  // liczby z projektu graficznego (licznik CountUp odtwarza format literalu,
  // ktory dostal, lacznie z lokalizacja en-US).
  {
    files: ['lib/format/**/*.ts', 'app/(marketing)/**/*.{ts,tsx}'],
    rules: { 'no-restricted-syntax': 'off', 'no-restricted-properties': 'off' },
  },

  // Testy jednostkowe sprawdzaja wnetrze modulow — to ich zadanie.
  {
    files: ['__test__/**/*.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off',
      // Testy formatowania musza siegnac do Intl, zeby sprawdzic cache.
      'no-restricted-syntax': 'off',
      'no-restricted-properties': 'off',
    },
  },

  // Konteksty serwerowe: serverEnv dozwolony, granice modulow NADAL obowiazuja.
  {
    files: ['app/**/route.ts', 'app/**/_actions/**/*.ts', '**/*.server.ts', 'middleware.ts', 'lib/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [moduleBoundaries] }],
    },
  },
)
