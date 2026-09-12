'use client'

import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatementModel } from '../../domain'

type Props = {
  model: StatementModel
}

/**
 * Luki w danych, ktore ksiegowa zauwazy dopiero przy urzedzie.
 *
 * Faktura bez okresu uslugi i faktura bez zarejestrowanej pracy nie sa bledem
 * aplikacji — sa brakiem w danych, ktory trzeba uzupelnic ZANIM plik pojdzie
 * dalej. Dlatego stoja nad tabela, a nie w stopce, i trafiaja takze do PDF.
 */
export function StatementWarnings({ model }: Props) {
  const t = useTranslations('accounting')

  const items = [
    model.missingPeriodCount > 0 && t('warnings.missingPeriod', { count: model.missingPeriodCount }),
    model.missingLocationCount > 0 &&
      t('warnings.missingLocation', { count: model.missingLocationCount }),
    model.draftCount > 0 && t('warnings.drafts', { count: model.draftCount }),
  ].filter((item): item is string => typeof item === 'string')

  if (items.length === 0) return null

  return (
    <section
      aria-label={t('warnings.title')}
      className={cn(
        'rounded-2xl border border-warning-500/30 bg-warning-500/10 p-4 text-warning-300',
        'sm:p-5',
      )}
    >
      <p className="flex items-center gap-2 text-sm font-medium">
        <AlertTriangle aria-hidden className="size-4" />
        {t('warnings.title')}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-xs">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}
