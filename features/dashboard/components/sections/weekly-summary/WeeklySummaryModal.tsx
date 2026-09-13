'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Copy, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  WorkspaceOverlay,
  WorkspaceOverlayBody,
  WorkspaceOverlayFooter,
} from '@/components/workspace'
import type {
  ContractorBlock,
  WeeklySummary,
} from '../../../lib/weekly-summary'
import type { AppFormat } from '@/lib/format'
import { useFormat } from '@/lib/format/client'
import { formatWeeklySummaryText } from './format'
import { formatDate, formatHours, formatRate, formatTotals } from './presentation'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  summary: WeeklySummary
  onPrevWeek: () => void
  onNextWeek: () => void
  canGoNext: boolean
}

function ContractorCard({ fmt, block }: { fmt: AppFormat; block: ContractorBlock }) {
  const address = [
    block.client?.address,
    [block.client?.postal_code, block.client?.city].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <section className="rounded-lg border border-hairline bg-surface-1 p-4 print:border-gray-300 print:bg-white">
      <header className="mb-3">
        <h3 className="text-sm font-semibold text-white print:text-black">{block.clientName}</h3>
        {block.client?.nip && (
          <p className="text-xs text-zinc-400 print:text-gray-600">NIP: {block.client.nip}</p>
        )}
        {address && (
          <p className="text-xs text-zinc-400 print:text-gray-600">{address}</p>
        )}
      </header>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
        {block.workLocations.length > 0 && (
          <Row label="Miejsce pracy">{block.workLocations.join('; ')}</Row>
        )}
        <Row label="Dni pracy (od – do)">
          {formatDate(fmt, block.workedFrom)} – {formatDate(fmt, block.workedTo)}
          <span className="text-zinc-400 print:text-gray-500"> ({block.workedDaysCount} dni)</span>
        </Row>
        <Row label="Godziny">{formatHours(fmt, block.totalHours)}</Row>
        <Row label="Stawka na fakturze">{block.rates.map((rate) => formatRate(fmt, rate)).join(', ')}</Row>
        <Row label="Do rozliczenia">{formatTotals(fmt, block)}</Row>
      </dl>
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-2xs uppercase tracking-wide text-zinc-400 print:text-gray-500">
        {label}
      </dt>
      <dd className="tabular-nums text-zinc-100 print:text-black">{children}</dd>
    </div>
  )
}

export function WeeklySummaryModal({
  open,
  onOpenChange,
  summary,
  onPrevWeek,
  onNextWeek,
  canGoNext,
}: Props) {
  const fmt = useFormat()
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formatWeeklySummaryText(fmt, summary))
      toast.success('Skopiowano podsumowanie do schowka')
    } catch {
      toast.error('Nie udało się skopiować do schowka')
    }
  }, [fmt, summary])

  return (
    <WorkspaceOverlay
      open={open}
      onOpenChange={onOpenChange}
      title={`KW ${summary.weekNumber}/${summary.weekYear}`}
      description={`Skrót przepracowanego tygodnia (${summary.rangeLabel}) — dla księgowej`}
      size="lg"
      headerAction={
        <div className="flex shrink-0 items-center gap-1 print:hidden">
          <Button variant="ghost" size="icon-sm" onClick={onPrevWeek} aria-label="Poprzedni tydzień">
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onNextWeek}
            disabled={!canGoNext}
            aria-label="Następny tydzień"
          >
            <ChevronRight />
          </Button>
        </div>
      }
    >
      <WorkspaceOverlayBody>
        <div data-print-area className="space-y-3">
          <div className="hidden print:block">
            <h2 className="text-base font-semibold">
              Podsumowanie tygodnia KW {summary.weekNumber}/{summary.weekYear}
            </h2>
            <p className="text-sm text-gray-600">{summary.rangeLabel}</p>
          </div>

          {summary.isEmpty ? (
            <p className="py-8 text-center text-sm text-zinc-400 print:text-black">
              Brak przepracowanych dni w tym tygodniu.
            </p>
          ) : (
            summary.contractors.map((block) => (
              <ContractorCard fmt={fmt} key={block.clientId ?? '__unassigned__'} block={block} />
            ))
          )}
        </div>
      </WorkspaceOverlayBody>

      <WorkspaceOverlayFooter className="print:hidden">
        <Button variant="outline" onClick={handleCopy} disabled={summary.isEmpty} className="h-11 sm:h-9">
          <Copy /> Kopiuj
        </Button>
        <Button
          variant="outline"
          onClick={() => window.print()}
          disabled={summary.isEmpty}
          className="h-11 sm:h-9"
        >
          <Printer /> Drukuj / PDF
        </Button>
        <Button variant="accent" onClick={() => onOpenChange(false)} className="h-11 sm:h-9">
          Zamknij
        </Button>
      </WorkspaceOverlayFooter>
    </WorkspaceOverlay>
  )
}
