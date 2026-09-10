'use client'

import { useTranslations } from 'next-intl'
import { ArrowDownRight, ArrowUpRight, Minus, Sparkles } from 'lucide-react'
import { useFormat } from '@/lib/format/client'
import { cn } from '@/lib/utils'
import type { MetricDelta } from '../../domain'

type Props = {
  delta: MetricDelta
  /** Zmiana bezwzgledna gotowa do pokazania (np. „+12 h"); pomijana, gdy nie wnosi nic. */
  absoluteLabel?: string
  /** Czy wzrost jest dobra wiadomoscia. Dla wszystkich metryk raportu — tak. */
  invert?: boolean
}

/**
 * Znacznik zmiany wzgledem poprzedniego okresu.
 *
 * Kolor niesie ZNACZENIE, nie dekoracje: zielony to wzrost, czerwony spadek,
 * a stany bez matematycznego procentu (`new`, `empty`) zostaja neutralne —
 * pokazanie ich na zielono sugerowaloby wzrost, ktorego nikt nie policzyl.
 */
export function TrendBadge({ delta, absoluteLabel, invert = false }: Props) {
  const t = useTranslations('reports')
  const fmt = useFormat()

  if (delta.status === 'empty') {
    return <Neutral label={t('compare.noData')} icon={Minus} />
  }

  if (delta.status === 'new') {
    return <Neutral label={t('compare.new')} icon={Sparkles} />
  }

  if (delta.status === 'flat') {
    return <Neutral label={t('compare.flat')} icon={Minus} />
  }

  const up = delta.status === 'up'
  const positive = invert ? !up : up
  const percent = fmt.percent(Math.abs(delta.ratio ?? 0), { max: 999 })

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-2xs font-medium tabular-nums',
        positive ? 'text-positive-400' : 'text-danger-400',
      )}
    >
      {up ? (
        <ArrowUpRight aria-hidden className="size-3" />
      ) : (
        <ArrowDownRight aria-hidden className="size-3" />
      )}
      <span className="sr-only">
        {up ? t('compare.increase', { value: percent }) : t('compare.decrease', { value: percent })}
      </span>
      <span aria-hidden>{percent}</span>
      {absoluteLabel && (
        <span aria-hidden className="text-zinc-400">
          {absoluteLabel}
        </span>
      )}
    </span>
  )
}

function Neutral({ label, icon: Icon }: { label: string; icon: typeof Minus }) {
  return (
    <span className="inline-flex items-center gap-1 text-2xs font-medium text-zinc-400">
      <Icon aria-hidden className="size-3" />
      {label}
    </span>
  )
}
