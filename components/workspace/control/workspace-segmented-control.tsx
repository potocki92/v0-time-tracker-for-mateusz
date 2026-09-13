'use client'

import { LINEAR } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'

type Option<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  value: T
  options: Array<Option<T>>
  onChange: (value: T) => void
  /** Etykieta grupy dla czytnika ekranu — gdy grupa nie ma widocznego nagłówka. */
  ariaLabel?: string
  /** Alternatywa dla `ariaLabel`, gdy widoczny nagłówek grupy już istnieje. */
  ariaLabelledBy?: string
  className?: string
}

/**
 * Przełącznik przekroju / metryki. Uogólniony `SegmentedControl` z Raportów.
 *
 * Pigułki celowo NIE są `role="tab"` — nie przełączają paneli, tylko zawartość
 * tej samej sekcji. Aktywna pigułka jest biała na czarnym tekście: to jedyne
 * miejsce w panelu, w którym biel pełni rolę wypełnienia, a nie tekstu, więc
 * stan aktywny czyta się bez użycia koloru akcentu.
 */
export function WorkspaceSegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  ariaLabelledBy,
  className,
}: Props<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={cn(
        'inline-flex gap-1 rounded-xl border p-1',
        LINEAR.border,
        LINEAR.surface,
        className,
      )}
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
