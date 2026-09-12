'use client'

import { useTranslations } from 'next-intl'
import { useFormat } from '@/lib/format/client'
import { LINEAR, SURFACE } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'
import type { StatementModel } from '../../domain'
import { StatementCard } from '../shared/StatementCard'

type Props = {
  model: StatementModel
}

function Figure({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="min-w-0">
      <p className={LINEAR.eyebrow}>{label}</p>
      <p
        className={cn(
          'mt-1 truncate text-sm font-semibold tabular-nums sm:text-base',
          muted ? 'text-zinc-300' : 'text-white',
        )}
      >
        {value}
      </p>
    </div>
  )
}

/**
 * Podsumowanie okresu — jedna karta na WALUTE.
 *
 * Waluty nie sumuja sie w jedna liczbe: kwota po przeliczeniu kursem nie
 * istnieje w zadnej ksiedze, a ksiegowa i tak wpisuje je osobno. Ta sama
 * zasada rzadzi `lib/finance/invoice-currency-totals`.
 */
export function StatementSummary({ model }: Props) {
  const t = useTranslations('accounting')
  const fmt = useFormat()

  return (
    <StatementCard
      title={t('summary.title')}
      ariaLabel={t('summary.sectionLabel')}
      action={
        <span className="text-2xs tabular-nums text-zinc-400">
          {t('summary.invoiceCount', { count: model.rows.length })}
        </span>
      }
    >
      <div className="mt-4 space-y-3">
        {model.totals.map((total) => (
          <div
            key={total.currency}
            className={cn(SURFACE.cardNested, 'grid grid-cols-2 gap-4 p-3 sm:grid-cols-5 sm:p-4')}
          >
            <Figure label={total.currency} value={t('summary.invoiceCount', { count: total.invoiceCount })} muted />
            <Figure label={t('summary.net')} value={fmt.money(total.netMinor, total.currency)} />
            <Figure label={t('summary.vat')} value={fmt.money(total.vatMinor, total.currency)} />
            <Figure label={t('summary.gross')} value={fmt.money(total.grossMinor, total.currency)} />
            <Figure
              label={`${t('summary.paid')} / ${t('summary.unpaid')}`}
              value={`${fmt.money(total.paidGrossMinor, total.currency)} / ${fmt.money(total.unpaidGrossMinor, total.currency)}`}
              muted
            />
          </div>
        ))}
      </div>

      <p className="mt-3 text-2xs text-zinc-400">{t('summary.currenciesNote')}</p>
    </StatementCard>
  )
}

/** Sumy kwartalne — ksiegowa rozlicza zaliczki kwartalnie, wiec dostaje je gotowe. */
export function StatementQuarters({ model }: Props) {
  const t = useTranslations('accounting')
  const fmt = useFormat()

  return (
    <StatementCard title={t('quarters.title')} ariaLabel={t('quarters.sectionLabel')}>
      {model.quarters.length === 0 ? (
        <p className="mt-4 text-xs text-zinc-400">{t('quarters.empty')}</p>
      ) : (
        <ul className="mt-4 divide-y divide-hairline">
          {model.quarters.map((quarter) => (
            <li
              key={`${quarter.key}-${quarter.currency}`}
              className="flex items-center justify-between gap-3 py-2.5 text-sm"
            >
              <span className="min-w-0 truncate text-zinc-300">
                {t('quarters.label', { year: quarter.year, quarter: quarter.quarter })} ·{' '}
                {quarter.currency}
              </span>
              <span className="shrink-0 tabular-nums text-white">
                {fmt.money(quarter.grossMinor, quarter.currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </StatementCard>
  )
}
