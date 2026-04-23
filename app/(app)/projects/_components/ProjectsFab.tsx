'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  onClick: () => void
  label?: string
}

/**
 * Floating action button pinned to the bottom-right on mobile. Hidden from
 * md: up (desktop keeps the inline header button). Respects iOS home-indicator
 * via safe-area-inset-bottom.
 */
export function ProjectsFab({ onClick, label = 'Dodaj projekt' }: Props) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-end px-4 pb-4 md:hidden"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <Button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="pointer-events-auto h-14 gap-2 rounded-full px-5 shadow-lg shadow-primary/30"
      >
        <Plus className="size-5" aria-hidden />
        <span className="text-sm font-medium">Dodaj</span>
      </Button>
    </div>
  )
}
