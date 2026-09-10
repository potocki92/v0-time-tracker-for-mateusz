'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useFormat } from '@/lib/format/client'
import { buildReportCsv, buildReportJson, exportFileName } from '../domain/export'
import type { ReportModel } from '../domain'

type Params = {
  model: ReportModel | null
  /** Opis aktywnych filtrow do naglowka PDF — sklada go komponent, bo zna nazwy klientow. */
  filtersSummary: string
}

export type UseReportsExportReturn = {
  exportCsv: () => void
  exportJson: () => void
  exportPdf: () => Promise<void>
  isGeneratingPdf: boolean
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

/**
 * Trzy eksporty raportu.
 *
 * Tresc plikow buduja czyste funkcje z `domain/export`; hook odpowiada tylko
 * za pobranie i komunikat. PDF dochodzi dynamicznym importem — `@react-pdf/renderer`
 * wazy wielokrotnie wiecej niz caly modul raportow, wiec nie moze byc czescia
 * bundla trasy tylko dlatego, ze w menu jest jedna pozycja wiecej.
 */
export function useReportsExport({ model, filtersSummary }: Params): UseReportsExportReturn {
  const t = useTranslations('reports')
  const fmt = useFormat()
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const exportCsv = useCallback(() => {
    if (!model) return
    try {
      const csv = buildReportCsv(
        model,
        {
          date: t('table.date'),
          client: t('table.client'),
          project: t('table.project'),
          workType: t('table.workType'),
          hours: t('table.hours'),
          quantity: t('table.quantity'),
          rate: t('table.rate'),
          currency: t('table.currency'),
          value: t('table.value'),
          valueBase: t('table.value'),
          billable: t('kpi.billable.label'),
          tags: t('table.tags'),
          source: t('table.source'),
        },
        { yes: t('export.yes'), no: t('export.no') },
      )
      download(
        new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
        exportFileName(t('export.fileName'), model, 'csv'),
      )
      toast.success(t('export.successCsv'))
    } catch {
      toast.error(t('export.errorCsv'))
    }
  }, [model, t])

  const exportJson = useCallback(() => {
    if (!model) return
    try {
      const json = buildReportJson(model, new Date().toISOString())
      download(
        new Blob([json], { type: 'application/json' }),
        exportFileName(t('export.fileName'), model, 'json'),
      )
      toast.success(t('export.successJson'))
    } catch {
      toast.error(t('export.errorJson'))
    }
  }, [model, t])

  const exportPdf = useCallback(async () => {
    if (!model) return
    setIsGeneratingPdf(true)
    const pending = toast.loading(t('export.generating'))

    try {
      const [{ pdf }, { ReportPdfDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../components/export/ReportPdfDocument'),
      ])

      const blob = await pdf(
        ReportPdfDocument({
          model,
          filtersSummary,
          generatedAt: fmt.date(new Date().toISOString().slice(0, 10), 'long'),
          fmt,
          labels: {
            title: t('export.pdfTitle'),
            range: t('export.pdfRange'),
            generatedAt: t('export.pdfGeneratedAt'),
            filters: t('export.pdfFilters'),
            noFilters: t('export.pdfNoFilters'),
            kpis: t('export.pdfKpis'),
            clients: t('export.pdfTopClients'),
            projects: t('export.pdfTopProjects'),
            share: t('export.pdfShare'),
            note: t('export.pdfNote'),
            unassigned: t('breakdown.unassigned'),
            kpiLabels: {
              totalHours: t('kpi.totalHours.label'),
              workValue: t('kpi.workValue.label'),
              activeDays: t('kpi.activeDays.label'),
              avgPerActiveDay: t('kpi.avgPerActiveDay.label'),
              effectiveRate: t('kpi.effectiveRate.label'),
              billable: t('kpi.billable.label'),
            },
          },
        }),
      ).toBlob()

      download(blob, exportFileName(t('export.fileName'), model, 'pdf'))
      toast.success(t('export.successPdf'), { id: pending })
    } catch {
      toast.error(t('export.errorPdf'), { id: pending })
    } finally {
      setIsGeneratingPdf(false)
    }
  }, [model, filtersSummary, fmt, t])

  return { exportCsv, exportJson, exportPdf, isGeneratingPdf }
}
