'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { TimeRange } from '@/app/(app)/dashboard/_domain/dashboard.types'

type ModalId =
  | 'invoice-create'
  | 'invoice-edit'
  | 'client-create'
  | 'client-edit'
  | 'work-entry'
  | 'goal-edit'
  | 'settings'

interface UiState {
  dashboardRange: TimeRange
  filters: {
    clientId?: string
    projectId?: string
    search:    string
  }
  modals: Record<ModalId, { open: boolean; payload?: unknown }>
}

interface UiActions {
  setRange:        (r: TimeRange) => void
  setClientFilter: (id?: string) => void
  setSearch:       (q: string) => void
  resetFilters:    () => void
  openModal:       <T = unknown>(id: ModalId, payload?: T) => void
  closeModal:      (id: ModalId) => void
}

const INITIAL_MODALS: UiState['modals'] = {
  'invoice-create': { open: false },
  'invoice-edit':   { open: false },
  'client-create':  { open: false },
  'client-edit':    { open: false },
  'work-entry':     { open: false },
  'goal-edit':      { open: false },
  'settings':       { open: false },
}

export const useUiStore = create<UiState & UiActions>()(
  persist(
    immer((set) => ({
      dashboardRange: 'current_month',
      filters: { search: '' },
      modals:  INITIAL_MODALS,

      setRange: (r) => set((s) => { s.dashboardRange = r }),
      setClientFilter: (id) => set((s) => { s.filters.clientId = id }),
      setSearch: (q) => set((s) => { s.filters.search = q }),
      resetFilters: () => set((s) => { s.filters = { search: '' } }),

      openModal: (id, payload) =>
        set((s) => { s.modals[id] = { open: true, payload } }),
      closeModal: (id) =>
        set((s) => { s.modals[id] = { open: false } }),
    })),
    {
      name: 'ui-state',
      // sessionStorage — UI state nie powinien przeżywać zamknięcia karty
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        dashboardRange: s.dashboardRange,
        filters: s.filters,
        // modals NIE są persistowane — zawsze startują zamknięte
      }),
    },
  ),
)

// Selektory atomowe
export const useDashboardRange = () => useUiStore((s) => s.dashboardRange)
export const useSetRange       = () => useUiStore((s) => s.setRange)
export const useModalState     = (id: ModalId) => useUiStore((s) => s.modals[id])
export const useOpenModal      = () => useUiStore((s) => s.openModal)
export const useCloseModal     = () => useUiStore((s) => s.closeModal)
