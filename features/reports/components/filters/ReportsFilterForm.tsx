'use client'

import { useTranslations } from 'next-intl'
import { LINEAR } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'
import {
  ALL,
  REPORT_PERIOD_PRESETS,
  type DateKey,
  type ReportClientRef,
  type ReportFilters,
  type ReportPeriodPreset,
  type ReportProjectRef,
} from '../../domain'

type Props = {
  filters: ReportFilters
  range: { start: DateKey; end: DateKey }
  clients: ReportClientRef[]
  projects: ReportProjectRef[]
  tags: string[]
  onPresetChange: (preset: ReportPeriodPreset) => void
  onCustomRangeChange: (from: DateKey, to: DateKey) => void
  onClientChange: (clientId: string) => void
  onProjectChange: (projectId: string) => void
  onTagChange: (tag: string) => void
}

const FIELD_CLASSES = cn(
  'h-11 w-full rounded-xl border px-3 text-sm text-zinc-200',
  LINEAR.border,
  LINEAR.surface,
  'placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/60 disabled:opacity-50',
)

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className={LINEAR.eyebrow}>
      {children}
    </label>
  )
}

/**
 * Formularz filtrow — jedna implementacja dla arkusza mobilnego i dla wersji
 * inline na desktopie.
 *
 * Dziewiec presetow siedzi w selekcie, a nie w dziewieciu przyciskach:
 * to ten sam element, ktorego uzywaja pozostale filtry, wiec pasek zostaje
 * plaski i przewidywalny takze wtedy, gdy dojdzie kolejny zakres.
 * Pola „Od/Do" pojawiaja sie WYLACZNIE przy zakresie wlasnym — przy presecie
 * byly martwym polem, ktore i tak nadpisywala data z presetu.
 */
export function ReportsFilterForm({
  filters,
  range,
  clients,
  projects,
  tags,
  onPresetChange,
  onCustomRangeChange,
  onClientChange,
  onProjectChange,
  onTagChange,
}: Props) {
  const t = useTranslations('reports')

  const visibleProjects =
    filters.clientId === ALL
      ? projects
      : projects.filter((project) => project.client_id === filters.clientId)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FieldLabel htmlFor="reports-preset">{t('period.label')}</FieldLabel>
        <select
          id="reports-preset"
          value={filters.preset}
          onChange={(event) => onPresetChange(event.target.value as ReportPeriodPreset)}
          className={FIELD_CLASSES}
        >
          {REPORT_PERIOD_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {t(`period.${preset}`)}
            </option>
          ))}
        </select>
      </div>

      {filters.preset === 'custom' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <FieldLabel htmlFor="reports-from">{t('period.from')}</FieldLabel>
            <input
              id="reports-from"
              type="date"
              value={range.start}
              max={range.end}
              onChange={(event) => onCustomRangeChange(event.target.value, range.end)}
              className={FIELD_CLASSES}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="reports-to">{t('period.to')}</FieldLabel>
            <input
              id="reports-to"
              type="date"
              value={range.end}
              min={range.start}
              onChange={(event) => onCustomRangeChange(range.start, event.target.value)}
              className={FIELD_CLASSES}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <FieldLabel htmlFor="reports-client">{t('filters.client')}</FieldLabel>
        <select
          id="reports-client"
          value={filters.clientId}
          onChange={(event) => onClientChange(event.target.value)}
          className={FIELD_CLASSES}
        >
          <option value={ALL}>{t('filters.allClients')}</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="reports-project">{t('filters.project')}</FieldLabel>
        <select
          id="reports-project"
          value={filters.projectId}
          onChange={(event) => onProjectChange(event.target.value)}
          className={FIELD_CLASSES}
        >
          <option value={ALL}>{t('filters.allProjects')}</option>
          {visibleProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="reports-tag">{t('filters.tag')}</FieldLabel>
        <select
          id="reports-tag"
          value={filters.tag}
          onChange={(event) => onTagChange(event.target.value)}
          className={FIELD_CLASSES}
        >
          <option value={ALL}>{t('filters.allTags')}</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
