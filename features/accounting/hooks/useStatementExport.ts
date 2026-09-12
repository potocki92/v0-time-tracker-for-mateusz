'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { createFormat } from '@/lib/format'
import type { AppLocale } from '@/i18n/config'
import { buildStatementCsv, statementFileName, type StatementModel } from '../domain'
import { loadStatementLabels } from '../i18n/document-labels'

type Params = {
  model: StatementModel | null
  /** Jezyk PLIKU — niezalezny od jezyka panelu. */
  documentLocale: AppLocale
  /** Nazwa klienta z filtra albo `null`; dana uzytkownika, nigdy nie tlumaczona. */
  clientName: string | null
}

export type UseStatementExportReturn = {
  exportCsv: () => Promise<void>
  exportPdf: () => Promise<void>
  isGenerating: boolean
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
 * Eksporty wykazu: CSV (import do programu ksiegowego) i PDF (dokument dla
 * ksiegowej i urzedu).
 *
 * Oba sa asynchroniczne, bo oba musza najpierw wczytac slownik W JEZYKU
 * DOKUMENTU — to on decyduje o naglowkach, a nie jezyk panelu. Dla PDF dochodzi
 * `@react-pdf/renderer`, ktory wazy wielokrotnie wiecej niz caly modul, wiec
 * nie moze byc czescia bundla trasy tylko dlatego, ze w menu jest jedna
 * pozycja wiecej.
 *
 * Tresc plikow buduja czyste funkcje (`domain/export.ts`, szablon PDF);
 * hook odpowiada za pobranie i komunikat.
 */
export function useStatementExport({
  model,
  documentLocale,
  clientName,
}: Params): UseStatementExportReturn {
  const t = useTranslations('accounting')
  const [isGenerating, setIsGenerating] = useState(false)

  const exportCsv = useCallback(async () => {
    if (!model) return

    try {
      const labels = await loadStatementLabels(documentLocale)
      download(
        new Blob([buildStatementCsv(model, labels)], { type: 'text/csv;charset=utf-8;' }),
        statementFileName(labels.fileName, model, 'csv'),
      )
      toast.success(t('export.successCsv'))
    } catch {
      toast.error(t('export.errorCsv'))
    }
  }, [model, documentLocale, t])

  const exportPdf = useCallback(async () => {
    if (!model) return

    setIsGenerating(true)
    const pending = toast.loading(t('export.generating'))

    try {
      const [{ pdf }, { StatementPdfDocument }, labels] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../components/export/StatementPdfDocument'),
        loadStatementLabels(documentLocale),
      ])

      // Formatter jedzie za JEZYKIEM DOKUMENTU: niemiecki wykaz ma miec
      // niemieckie daty i niemiecki zapis kwot, nawet gdy panel stoi na polskim.
      const fmt = createFormat(documentLocale)

      const blob = await pdf(
        StatementPdfDocument({
          model,
          labels,
          clientName,
          generatedAt: fmt.date(new Date().toISOString().slice(0, 10), 'long'),
          fmt,
        }),
      ).toBlob()

      download(blob, statementFileName(labels.fileName, model, 'pdf'))
      toast.success(t('export.successPdf'), { id: pending })
    } catch {
      toast.error(t('export.errorPdf'), { id: pending })
    } finally {
      setIsGenerating(false)
    }
  }, [model, documentLocale, clientName, t])

  return { exportCsv, exportPdf, isGenerating }
}
