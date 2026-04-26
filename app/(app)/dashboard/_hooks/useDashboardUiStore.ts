/**
 * Dashboard UI store — preferencje czysto wizualne / sesyjne.
 *
 * W odróżnieniu od `usePreferencesStore` (który syncuje się z Supabase
 * `user_metadata`), tutaj trzymamy stany związane z prezentacją: tryb
 * porównania, tryb prywatności itd. Persist do localStorage daje
 * zachowanie między sesjami bez round-tripu po sieci.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface DashboardUiState {
  /** Globalne ukrywanie kwot — przydatne przy demo / pracy w pociągu */
  privacyMode: boolean
  /** Czy podświetlać delty względem poprzedniego okresu w KPI */
  compareMode: boolean
}

interface DashboardUiActions {
  togglePrivacy: () => void
  toggleCompare: () => void
  setPrivacy: (value: boolean) => void
  setCompare: (value: boolean) => void
}

export type DashboardUiStore = DashboardUiState & DashboardUiActions

const DEFAULTS: DashboardUiState = {
  privacyMode: false,
  compareMode: true,
}

export const useDashboardUiStore = create<DashboardUiStore>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      togglePrivacy: () => set((s) => ({ privacyMode: !s.privacyMode })),
      toggleCompare: () => set((s) => ({ compareMode: !s.compareMode })),
      setPrivacy: (value) => set({ privacyMode: value }),
      setCompare: (value) => set({ compareMode: value }),
    }),
    {
      name: 'dashboard-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        privacyMode: state.privacyMode,
        compareMode: state.compareMode,
      }),
    },
  ),
)

export const usePrivacyMode = () => useDashboardUiStore((s) => s.privacyMode)
export const useCompareMode = () => useDashboardUiStore((s) => s.compareMode)

/**
 * Maskuje napis z kwotą. W odróżnieniu od pseudo-blura wykonuje
 * fizyczne zastąpienie cyfr i separatorów znakiem `•`, dzięki czemu
 * wartość jest niewidoczna nawet po zaznaczeniu / screenshotcie.
 * Symbol waluty zostaje, żeby utrzymać kontekst.
 */
export function maskValue(value: string, masked: boolean): string {
  if (!masked) return value
  // np. "12 345,67 zł" → "•••••• zł"
  return value.replace(/[\d.,\s ]+/g, '•••••• ').trim()
}
