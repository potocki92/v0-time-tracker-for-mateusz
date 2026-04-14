'use client'

/**
 * useKeyboardSidebar — pomysł #3
 *
 * Cmd+B (Mac) / Ctrl+B (Windows/Linux) = toggle sidebar.
 * Standardowy skrót znany z VS Code, Notion, Linear.
 *
 * Użycie: wywołaj raz w głównym layoucie lub w AppSidebar.
 */

import { useEffect } from 'react'
import { useSidebar } from '@/components/ui/sidebar'

export function useKeyboardSidebar(): void {
  const { toggleSidebar } = useSidebar()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey
      if (isMeta && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])
}