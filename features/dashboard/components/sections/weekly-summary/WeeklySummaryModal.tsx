'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Copy, Printer } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type {
  ContractorBlock,
  WeeklySummary,
} from '@/features/dashboard/lib/weekly-summary'
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

function ContractorCard({ block }: { block: ContractorBlock }) {
  const address = [
    block.client?.address,
    [block.client?.postal_code, block.client?.city].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <section className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4 print:border-gray-300 print:bg-white">
      <header className="mb-3">
        <h3 className="text-sm font-semibold text-white print:text-black">{block.clientName}</h3>
        {block.client?.nip && (
          <p className="text-[12px] text-zinc-400 print:text-gray-600">NIP: {block.client.nip}</p>
        )}
        {address && (
          <p className="text-[12px] text-zinc-400 print:text-gray-600">{address}</p>
        )}
      </header>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
        <Row label="Dni pracy (od – do)">
          {formatDate(block.workedFrom)} – {formatDate(block.workedTo)}
          <span className="text-zinc-500 print:text-gray-500"> ({block.workedDaysCount} dni)</span>
        </Row>
        <Row label="Godziny">{formatHours(block.totalHours)}</Row>
        <Row label="Stawka na fakturze">{block.rates.map(formatRate).join(', ')}</Row>
        <Row label="Do rozliczenia">{formatTotals(block)}</Row>
      </dl>
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-zinc-500 print:text-gray-500">
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
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formatWeeklySummaryText(summary))
      toast.success('Skopiowano podsumowanie do schowka')
    } catch {
      toast.error('Nie udało się skopiować do schowka')
    }
  }, [summary])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 print:hidden">
            <Button variant="ghost" size="icon-sm" onClick={onPrevWeek} aria-label="Poprzedni tydzień">
              <ChevronLeft />
            </Button>
            <DialogTitle className="text-center">
              KW {summary.weekNumber}/{summary.weekYear}
            </DialogTitle>
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
          <DialogDescription className="text-center print:hidden">
            Skrót przepracowanego tygodnia ({summary.rangeLabel}) — dla księgowej
          </DialogDescription>
        </DialogHeader>

        <div data-print-area className="space-y-3">
          <div className="hidden print:block">
            <h2 className="text-base font-semibold">
              Podsumowanie tygodnia KW {summary.weekNumber}/{summary.weekYear}
            </h2>
            <p className="text-sm text-gray-600">{summary.rangeLabel}</p>
          </div>

          {summary.isEmpty ? (
            <p className="py-8 text-center text-sm text-zinc-500 print:text-black">
              Brak przepracowanych dni w tym tygodniu.
            </p>
          ) : (
            summary.contractors.map((block) => (
              <ContractorCard key={block.clientId ?? '__unassigned__'} block={block} />
            ))
          )}
        </div>

        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={handleCopy} disabled={summary.isEmpty}>
            <Copy /> Kopiuj
          </Button>
          <Button variant="outline" onClick={() => window.print()} disabled={summary.isEmpty}>
            <Printer /> Drukuj / PDF
          </Button>
          <Button onClick={() => onOpenChange(false)}>Zamknij</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
