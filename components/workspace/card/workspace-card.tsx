'use client'

import type { ReactNode } from 'react'
import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import { SURFACE } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  /** Etykieta landmarku — pełniejsza niż tytuł, dla czytnika ekranu. */
  ariaLabel: string
  /** Prawa strona nagłówka: przełącznik metryki, licznik, notka. */
  action?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Powierzchnia sekcji panelu: karta + nagłówek z eyebrow i slotem na akcję.
 *
 * Uogólniony `ReportCard` — wcześniej ten sam komponent stał w dwóch kopiach
 * (`features/reports/.../ReportCard`, `features/accounting/.../StatementCard`),
 * bo `features/*` nie mogą się importować wzajemnie.
 *
 * Wszystkie sekcje mają ten sam rytm (padding, odstęp pod nagłówkiem, stopień
 * typografii), więc powtarzalność jest tu STRUKTURALNA, nie przypadkowa —
 * dlatego jeden komponent, a nie skopiowany className.
 */
export function WorkspaceCard({ title, ariaLabel, action, children, className }: Props) {
  return (
    <section aria-label={ariaLabel} className={cn(SURFACE.card, 'p-4 sm:p-5', className)}>
      <header className="flex min-h-8 items-center justify-between gap-3">
        <SectionEyebrow as="h2">{title}</SectionEyebrow>
        {action}
      </header>
      {children}
    </section>
  )
}
