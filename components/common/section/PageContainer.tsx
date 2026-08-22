import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Kontener treści sekcji panelu. Jeden ciąg klas zamiast czterech wariantów
 * rozsianych po `*Content.tsx` i `*Skeleton.tsx` — dzięki temu treść ma tę samą
 * szerokość i te same marginesy niezależnie od sekcji, a skeleton nie skacze
 * względem treści, którą zastępuje.
 *
 * Pulpit świadomie tu nie wchodzi — ma własną siatkę `data-dashboard-grid`.
 */
export function PageContainer({
  children,
  className,
  'data-testid': testId,
}: {
  children: ReactNode
  className?: string
  /** Skeletony sekcji identyfikuje `section-skeleton` — patrz e2e/navigation.spec.ts. */
  'data-testid'?: string
}) {
  return (
    <div
      data-slot="page-container"
      data-testid={testId}
      className={cn(
        'mx-auto w-full max-w-2xl space-y-5 px-3 pb-28 pt-2 sm:px-4 md:max-w-5xl md:px-6 md:pb-10 md:pt-3 lg:px-8',
        className,
      )}
    >
      {children}
    </div>
  )
}
