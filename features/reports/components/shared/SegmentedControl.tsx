'use client'

import { LINEAR } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'

type Option<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  /** Etykieta grupy dla czytnika ekranu — grupa nie ma widocznego naglowka. */
  ariaLabel: string
  value: T
  options: Array<Option<T>>
  onChange: (value: T) => void
  className?: string
}

/**
 * Przelacznik metryki / przekroju.
 *
 * Jeden komponent dla wykresu i breakdownow: te same stany, ta sama obsluga
 * klawiatury i to samo `aria-pressed`. Pigulki celowo NIE sa `role="tab"` —
 * nie przelaczaja paneli, tylko zawartosc tej samej sekcji.
 */
export function SegmentedControl<T extends string>({
  ariaLabel,
  value,
  options,
  onChange,
  className,
}: Props<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('inline-flex gap-1 rounded-xl border p-1', LINEAR.border, LINEAR.surface, className)}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-8 rounded-lg px-2.5 text-2xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/60 sm:text-xs',
              active ? 'bg-white text-black' : 'text-zinc-400 hover:bg-surface-3 hover:text-zinc-200',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
