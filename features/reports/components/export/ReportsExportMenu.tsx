'use client'

import { useTranslations } from 'next-intl'
import { Download, FileJson, FileSpreadsheet, FileText, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LINEAR } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'

type Props = {
  onExportCsv: () => void
  onExportJson: () => void
  onExportPdf: () => void
  onExportWorksiteCsv: () => void
  onExportWorksitePdf: () => void
  disabled: boolean
}

export function ReportsExportMenu({
  onExportCsv,
  onExportJson,
  onExportPdf,
  onExportWorksiteCsv,
  onExportWorksitePdf,
  disabled,
}: Props) {
  const t = useTranslations('reports')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          aria-label={t('export.menuLabel')}
          className={cn('rounded-xl text-zinc-200', LINEAR.border, LINEAR.surface, LINEAR.surfaceHover)}
        >
          <Download aria-hidden className="size-4" />
          <span className="hidden sm:inline">{t('export.trigger')}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className={cn('w-60 rounded-xl text-zinc-200', LINEAR.border, LINEAR.surface)}
      >
        <DropdownMenuLabel className={LINEAR.eyebrow}>{t('export.menuLabel')}</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-hairline" />
        <DropdownMenuItem onSelect={onExportCsv} className="gap-2">
          <FileSpreadsheet aria-hidden className="size-4 text-brand-400" />
          {t('export.csv')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onExportJson} className="gap-2">
          <FileJson aria-hidden className="size-4 text-info-400" />
          {t('export.json')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onExportPdf} className="gap-2">
          <FileText aria-hidden className="size-4 text-zinc-300" />
          {t('export.pdf')}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-hairline" />
        <DropdownMenuLabel className={LINEAR.eyebrow}>{t('export.worksiteGroup')}</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onExportWorksitePdf} className="gap-2">
          <MapPin aria-hidden className="size-4 text-brand-400" />
          {t('export.worksitePdf')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onExportWorksiteCsv} className="gap-2">
          <FileSpreadsheet aria-hidden className="size-4 text-zinc-300" />
          {t('export.worksiteCsv')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
