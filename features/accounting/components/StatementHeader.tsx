'use client'

import { useTranslations } from 'next-intl'
import { ArrowLeft, FileSpreadsheet } from 'lucide-react'
import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import { WorkspaceHeaderActions } from '@/components/workspace/workspace-header-slot'
import { Link } from '@/i18n/navigation'
import { StatementExportMenu } from './export/StatementExportMenu'

type Props = {
  rangeLabel: string
  documentLocaleLabel: string
  onExportPdf: () => void
  onExportCsv: () => void
  exportDisabled: boolean
}

export function StatementHeader({
  rangeLabel,
  documentLocaleLabel,
  onExportPdf,
  onExportCsv,
  exportDisabled,
}: Props) {
  const t = useTranslations('accounting')

  return (
    <header className="min-w-0">
      <WorkspaceHeaderActions>
        <StatementExportMenu
          onExportPdf={onExportPdf}
          onExportCsv={onExportCsv}
          disabled={exportDisabled}
          documentLocaleLabel={documentLocaleLabel}
        />
      </WorkspaceHeaderActions>

      <div className="min-w-0">
        <SectionEyebrow>{t('header.eyebrow')}</SectionEyebrow>
        <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold text-white sm:text-2xl">
          <FileSpreadsheet aria-hidden className="size-5 text-zinc-400 sm:size-6" />
          {t('header.title')}
        </h1>
        <p className="mt-1 truncate text-xs text-zinc-400 sm:text-sm">{rangeLabel}</p>
        <Link
          href="/reports"
          className="mt-2 inline-flex items-center gap-1.5 text-2xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft aria-hidden className="size-3.5" />
          {t('header.backToReports')}
        </Link>
      </div>
    </header>
  )
}
