'use client'

import { useEffect } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  COLOR_THEME_ATTRIBUTE,
  COLOR_THEME_STORAGE_KEY,
  DEFAULT_COLOR_THEME,
  isColorThemeId,
  type ColorThemeId,
} from '@/lib/themes/color-themes'

interface ColorThemeState {
  theme: ColorThemeId
  setTheme: (theme: ColorThemeId) => void
}

const useColorThemeStore = create<ColorThemeState>()(
  persist(
    (set) => ({
      theme: DEFAULT_COLOR_THEME,
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: COLOR_THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Persistujemy tylko wartość motywu — bez referencji do funkcji.
      partialize: (s) => ({ theme: s.theme }),
    },
  ),
)

export const useColorTheme = () => useColorThemeStore((s) => s.theme)
export const useSetColorTheme = () => useColorThemeStore((s) => s.setTheme)

/**
 * Hook który synchronizuje wartość w store z atrybutem data-theme na <html>.
 * Skrypt pre-hydration ustawia atrybut przed pierwszym renderem (żeby uniknąć FOUC),
 * a ten hook domyka pętlę: każda zmiana w store natychmiast propaguje do DOM.
 */
export function useApplyColorTheme() {
  const theme = useColorTheme()

  useEffect(() => {
    if (typeof document === 'undefined') return
    const resolved = isColorThemeId(theme) ? theme : DEFAULT_COLOR_THEME
    document.documentElement.setAttribute(COLOR_THEME_ATTRIBUTE, resolved)
  }, [theme])
}
