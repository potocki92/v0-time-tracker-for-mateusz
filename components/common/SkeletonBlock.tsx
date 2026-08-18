import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  height?: number | string
  rounded?: 'sm' | 'md' | 'lg' | 'full'
  style?: CSSProperties
}

/**
 * Uniwersalny bloczek skeleton — jeden komponent zamiast 7 per karta.
 *
 * - `content-visibility: auto` + `contain-intrinsic-size` eliminują CLS
 *   bez duplikacji wymiarów w markupie.
 * - `data-slot="skeleton"` pozwala testom/CSS targetować wszystkie fallbacki.
 * - Klasa `.skeleton` (z globals.css) dzieli wspólną oś czasu animacji
 *   przez `animation-delay: -1.5s` — wszystkie pulsują fazowo razem.
 */
export function SkeletonBlock({
  className,
  height,
  rounded = 'md',
  style,
}: Props) {
  const roundedClass = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }[rounded]

  const resolvedHeight =
    typeof height === 'number' ? `${height}px` : height

  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn('skeleton bg-accent/70 w-full', roundedClass, className)}
      style={{
        height: resolvedHeight,
        contentVisibility: 'auto',
        containIntrinsicSize: resolvedHeight ? `${resolvedHeight} 100%` : undefined,
        ...style,
      }}
    />
  )
}
