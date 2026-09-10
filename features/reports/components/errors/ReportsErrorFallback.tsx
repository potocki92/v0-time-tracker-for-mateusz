'use client'

import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'
import { PageContainer } from '@/components/common/section/PageContainer'
import type { ErrorBoundaryFallbackProps } from '@/components/common/errors'
import { LINEAR, SURFACE } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'

/**
 * Stan bledu raportu.
 *
 * Wspolny `DefaultFallback` nie zna przestrzeni `reports` i nie stoi na
 * powierzchni panelu — raport dostaje wiec wlasny, przetlumaczony ekran
 * w tym samym jezyku wizualnym co reszta sekcji.
 */
export function ReportsErrorFallback({ resetError }: ErrorBoundaryFallbackProps) {
  const t = useTranslations('reports')

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <PageContainer>
        <div
          role="alert"
          className={cn(
            SURFACE.cardDashed,
            'flex flex-col items-center justify-center gap-3 px-4 py-16 text-center',
          )}
        >
          <AlertTriangle aria-hidden className="size-6 text-danger-400" />
          <p className="text-sm font-medium text-zinc-200">{t('states.errorTitle')}</p>
          <p className="max-w-xs text-xs text-zinc-400">{t('states.errorDescription')}</p>
          <button
            type="button"
            onClick={resetError}
            className={cn(
              'mt-1 inline-flex h-10 items-center rounded-xl border px-4 text-sm font-medium text-zinc-200 transition-colors hover:bg-surface-3',
              LINEAR.border,
              LINEAR.surface,
            )}
          >
            {t('states.retry')}
          </button>
        </div>
      </PageContainer>
    </div>
  )
}
