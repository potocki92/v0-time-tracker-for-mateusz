import type { ReactNode } from 'react'

/**
 * Next wymaga pliku `app/layout.tsx`, ale PRAWDZIWY root layout stoi pietro
 * nizej — w `app/[locale]/layout.tsx`. Tylko tam znany jest jezyk, a bez
 * jezyka nie da sie poprawnie wyrenderowac `<html lang>`; atrybut ustawiony
 * tutaj bylby zgadywaniem i wracalibysmy do zaszytego na sztywno `lang="pl"`.
 *
 * Ten plik jest wiec celowo przezroczysty: nie renderuje ani `<html>`, ani
 * `<body>`, ani zadnego providera.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children
}
