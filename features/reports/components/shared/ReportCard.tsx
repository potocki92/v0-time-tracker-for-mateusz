'use client'

import type { ReactNode } from 'react'
import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import { SURFACE } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  /** Etykieta landmarku — pelniejsza niz tytul, dla czytnika ekranu. */
  ariaLabel: string
  /** Prawa strona naglowka: przelacznik metryki, licznik, notka. */
  action?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Powierzchnia sekcji raportu: karta + naglowek z eyebrow i slotem na akcje.
 *
 * Wszystkie sekcje raportu maja ten sam rytm (padding, odstep pod naglowkiem,
 * stopien typografii), wiec powtarzalnosc jest tu STRUKTURALNA, nie
 * przypadkowa — dlatego jeden komponent, a nie skopiowany className.
 */
export function ReportCard({ title, ariaLabel, action, children, className }: Props) {
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
