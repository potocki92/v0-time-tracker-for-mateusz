'use client'

import { useTranslations } from 'next-intl'
import { BarChart3 } from 'lucide-react'
import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import { WorkspaceHeaderActions } from '@/components/workspace/workspace-header-slot'
import { ReportsExportMenu } from './export/ReportsExportMenu'

type Props = {
  rangeLabel: string
  compareLabel: string | null
  onExportCsv: () => void
  onExportJson: () => void
  onExportPdf: () => void
  onExportWorksiteCsv: () => void
  onExportWorksitePdf: () => void
  exportDisabled: boolean
}

export function ReportsHeader({
  rangeLabel,
  compareLabel,
  onExportCsv,
  onExportJson,
  onExportPdf,
  onExportWorksiteCsv,
  onExportWorksitePdf,
  exportDisabled,
}: Props) {
  const t = useTranslations('reports')

  return (
    <header className="min-w-0">
      <WorkspaceHeaderActions>
        <ReportsExportMenu
          onExportCsv={onExportCsv}
          onExportJson={onExportJson}
          onExportPdf={onExportPdf}
          onExportWorksiteCsv={onExportWorksiteCsv}
          onExportWorksitePdf={onExportWorksitePdf}
          disabled={exportDisabled}
        />
      </WorkspaceHeaderActions>

      <div className="min-w-0">
        <SectionEyebrow>{t('header.eyebrow')}</SectionEyebrow>
        <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold text-white sm:text-2xl">
          <BarChart3 aria-hidden className="size-5 text-zinc-400 sm:size-6" />
          {t('header.title')}
        </h1>
        <p className="mt-1 truncate text-xs text-zinc-400 sm:text-sm">{rangeLabel}</p>
        {compareLabel && (
          <p className="mt-0.5 truncate text-2xs text-zinc-400">{compareLabel}</p>
        )}
      </div>
    </header>
  )
}
