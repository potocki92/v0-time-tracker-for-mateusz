'use client'

import { useApplyColorTheme } from '@/hooks/stores/useColorThemeStore'

/**
 * Synchronizuje store (persisted w localStorage) z atrybutem `data-theme` na <html>.
 * Montowany w drzewie, żeby każda zmiana w store natychmiast propagowała do DOM.
 *
 * Uwaga: pierwsze ustawienie atrybutu robi skrypt inline w <head>
 * (zob. `ColorThemeInitScript`), żeby nie było mignięcia.
 */
export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  useApplyColorTheme()
  return <>{children}</>
}
