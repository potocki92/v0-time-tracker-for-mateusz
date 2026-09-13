'use client'

import { useTranslations } from 'next-intl'
import { TrendingUp } from 'lucide-react'
import { WorkspaceFilters } from '@/components/workspace'
import { cn } from '@/lib/utils'
import type {
  DateKey,
  ReportClientRef,
  ReportFilters as Filters,
  ReportPeriodPreset,
  ReportProjectRef,
} from '../../domain'
import { ReportsFilterForm } from './ReportsFilterForm'

type Props = {
  filters: Filters
  range: { start: DateKey; end: DateKey }
  clients: ReportClientRef[]
  projects: ReportProjectRef[]
  tags: string[]
  activeCount: number
  onPresetChange: (preset: ReportPeriodPreset) => void
  onCustomRangeChange: (from: DateKey, to: DateKey) => void
  onClientChange: (clientId: string) => void
  onProjectChange: (projectId: string) => void
  onTagChange: (tag: string) => void
  onToggleCompare: () => void
  onReset: () => void
}

/**
 * Pasek filtrow raportu.
 *
 * Cala mechanika paska (trigger, badge, arkusz, scroll, reset/zastosuj,
 * wersja inline na desktopie) siedzi w `WorkspaceFilters`. Tutaj zostaja
 * wylacznie POLA raportu i przelacznik porownania — jedyna kontrolka, ktorej
 * pozostale sekcje nie maja.
 */
export function ReportsFilters(props: Props) {
  const t = useTranslations('reports')

  const formProps = {
    filters: props.filters,
    range: props.range,
    clients: props.clients,
    projects: props.projects,
    tags: props.tags,
    onPresetChange: props.onPresetChange,
    onCustomRangeChange: props.onCustomRangeChange,
    onClientChange: props.onClientChange,
    onProjectChange: props.onProjectChange,
    onTagChange: props.onTagChange,
  }

  const compareButton = (className: string) => (
    <button
      type="button"
      onClick={props.onToggleCompare}
      aria-pressed={props.filters.compare}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/60',
        props.filters.compare
          ? 'border-white/20 bg-white text-black'
          : 'border-hairline bg-surface-2 text-zinc-300 hover:bg-surface-3',
        className,
      )}
    >
      <TrendingUp aria-hidden className="size-4" />
      <span className="sr-only md:not-sr-only">{t('filters.compare')}</span>
    </button>
  )

  return (
    <WorkspaceFilters
      sectionLabel={t('filters.sectionLabel')}
      title={t('filters.sheetTitle')}
      description={t('filters.sheetDescription')}
      activeCount={props.activeCount}
      onReset={props.onReset}
      trailing={compareButton('h-11 w-11 shrink-0 justify-center px-0')}
      desktopTrailing={compareButton('h-9 px-3 text-sm')}
    >
      <ReportsFilterForm {...formProps} />
    </WorkspaceFilters>
  )
}
