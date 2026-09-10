'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { FolderOpen } from 'lucide-react'
import { useFormat } from '@/lib/format/client'
import type { BreakdownDimension, ReportModel } from '../../domain'
import { ReportCard } from '../shared/ReportCard'
import { ReportEmptyState } from '../shared/ReportEmptyState'
import { SegmentedControl } from '../shared/SegmentedControl'
import { BreakdownRow } from './BreakdownRow'

type Props = {
  model: ReportModel
}

/** Ile pozycji widac bez rozwiniecia — dluga lista klientow nie moze zjesc ekranu. */
const COLLAPSED_LIMIT = 6

/**
 * Podzial pracy w trzech przekrojach: klienci, projekty, tagi.
 *
 * Jeden komponent i jeden wiersz zamiast trzech kopii tego samego markupu —
 * przelacznik zmienia DANE, nie uklad.
 */
export function ReportsBreakdownSection({ model }: Props) {
  const t = useTranslations('reports')
  const fmt = useFormat()
  const [dimension, setDimension] = useState<BreakdownDimension>('client')
  const [expanded, setExpanded] = useState(false)

  const items = model.breakdowns[dimension]
  const visible = expanded ? items : items.slice(0, COLLAPSED_LIMIT)
  const fallbackLabel = dimension === 'tag' ? t('breakdown.untagged') : t('breakdown.unassigned')

  return (
    <ReportCard
      title={t('breakdown.title')}
      ariaLabel={t('breakdown.sectionLabel')}
      action={
        <SegmentedControl
          ariaLabel={t('breakdown.dimensionSwitcher')}
          value={dimension}
          onChange={(next) => {
            setDimension(next)
            setExpanded(false)
          }}
          options={[
            { value: 'client', label: t('breakdown.client') },
            { value: 'project', label: t('breakdown.project') },
            { value: 'tag', label: t('breakdown.tag') },
          ]}
        />
      }
    >
      {items.length === 0 ? (
        <ReportEmptyState
          icon={FolderOpen}
          title={t('breakdown.empty')}
          description={t('states.noMatchDescription')}
          className="mt-4"
        />
      ) : (
        <>
          <ul role="list" className="mt-4 space-y-3.5">
            {visible.map((item) => (
              <BreakdownRow
                key={item.key || 'unassigned'}
                item={item}
                fallbackLabel={fallbackLabel}
                currency={model.currency}
                shareLabel={t('breakdown.shareOf', {
                  label: item.label ?? fallbackLabel,
                  share: fmt.percent(item.share),
                })}
              />
            ))}
          </ul>

          {items.length > COLLAPSED_LIMIT && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-4 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
            >
              {expanded ? t('breakdown.showLess') : t('breakdown.showAll', { count: items.length })}
            </button>
          )}

          {dimension === 'tag' && (
            <p className="mt-3 text-2xs text-zinc-400">{t('breakdown.tagOverlapNote')}</p>
          )}
        </>
      )}
    </ReportCard>
  )
}
