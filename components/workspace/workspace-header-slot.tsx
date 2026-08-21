'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Slot na akcje strony w naglowku obszaru roboczego.
 *
 * Naglowek renderuje sie raz, w layoucie panelu, a przycisk glowny nalezy do
 * strony. Zamiast przewlekac go propsami przez layout, strona renderuje go
 * przez portal do wezla wystawionego przez naglowek.
 *
 * Wezel trafia do contextu przez callback ref, wiec portal powstaje dopiero
 * gdy DOM istnieje — na serwerze `node` jest `null` i nie renderujemy nic.
 * Zaden `useEffect` nie bierze w tym udzialu, wiec akcja nie miga po montazu.
 */
interface HeaderSlot {
  node: HTMLElement | null
  setNode: (node: HTMLElement | null) => void
}

const HeaderSlotContext = createContext<HeaderSlot | null>(null)

export function WorkspaceHeaderSlotProvider({ children }: { children: ReactNode }) {
  const [node, setNode] = useState<HTMLElement | null>(null)
  const value = useMemo<HeaderSlot>(() => ({ node, setNode }), [node])

  return <HeaderSlotContext.Provider value={value}>{children}</HeaderSlotContext.Provider>
}

/** Callback ref dla kontenera akcji w naglowku. */
export function useHeaderSlotRef(): HeaderSlot['setNode'] {
  const slot = useContext(HeaderSlotContext)
  if (!slot) {
    throw new Error('useHeaderSlotRef wymaga <WorkspaceHeaderSlotProvider> w drzewie')
  }
  return slot.setNode
}

/** Renderuje akcje strony w naglowku obszaru roboczego. */
export function WorkspaceHeaderActions({ children }: { children: ReactNode }) {
  const slot = useContext(HeaderSlotContext)
  if (!slot?.node) return null
  return createPortal(children, slot.node)
}
