'use client'

import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Client, Invoice } from '@/lib/types'
import { formatCurrency } from '@/lib/helpers'
import { displayInvoiceNumber } from '@/lib/finance/invoice-number'
import {
  INVOICE_STATUS_LABELS_PL,
  InvoiceStatus,
  deriveInvoiceStatus,
} from '@/lib/finance/invoice-status'
import { polishMonthShort } from '../../domain/stats'

interface InvoiceListItemProps {
  invoice: Invoice
  client: Client | null
  selected: boolean
  hours?: number | null
  onSelect: () => void
}

const STATUS_PILL: Record<InvoiceStatus, string> = {
  [InvoiceStatus.PAID]: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  [InvoiceStatus.SENT]: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  [InvoiceStatus.OVERDUE]: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30',
  [InvoiceStatus.DRAFT]: 'bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30',
  [InvoiceStatus.CANCELLED]: 'bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20',
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${polishMonthShort(d.getMonth())} ${d.getDate()}`
}

export function InvoiceListItem({
  invoice,
  client,
  selected,
  hours,
  onSelect,
}: InvoiceListItemProps) {
  const status = deriveInvoiceStatus(invoice)
  const numberLabel = displayInvoiceNumber(invoice)
  const period = invoice.billing_period?.trim() || invoice.name?.trim() || ''
  const clientName = client?.name ?? invoice.recipient ?? 'Bez klienta'
  const dateLabel = formatShortDate(invoice.invoice_date ?? invoice.issue_date ?? null)

  return (
    <article
      className={cn(
        'rounded-2xl border bg-[#0a0a0a] p-4 transition',
        selected
          ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
          : 'border-[#1a1a1a] hover:border-[#262626]',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full flex-col gap-3 text-left"
        aria-pressed={selected}
      >
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#1a1a1a] bg-[#0e0e0e] text-zinc-400"
            >
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0 space-y-0.5">
              <p className="truncate text-[13px] font-semibold tabular-nums text-white">
                {numberLabel}
              </p>
              {period && (
                <p className="truncate text-[11.5px] text-zinc-500">{period}</p>
              )}
            </div>
          </div>

          <span
            className={cn(
              'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold',
              STATUS_PILL[status],
            )}
          >
            {INVOICE_STATUS_LABELS_PL[status]}
          </span>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#161616] pt-3">
          <p className="truncate text-[13px] font-medium text-zinc-200">{clientName}</p>
        </div>

        <footer className="flex items-end justify-between gap-3 tabular-nums">
          <div className="flex items-center gap-3 text-[12px] text-zinc-500">
            {typeof hours === 'number' && hours > 0 && <span>{Math.round(hours)} h</span>}
            {dateLabel && <span>{dateLabel}</span>}
          </div>
          <span className="text-[15px] font-semibold text-white">
            {formatCurrency(invoice.amount, invoice.currency)}
          </span>
        </footer>
      </button>
    </article>
  )
}
