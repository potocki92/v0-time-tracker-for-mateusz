'use client'

import { CheckCircle2, ChevronDown, Clock3, Copy, Download, Mail, Pencil, Printer, Trash2 } from 'lucide-react'
import type { Client, Invoice, InvoiceLifecycleStatus } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import { displayInvoiceNumber } from '@/lib/finance/invoice-number'
import {
  INVOICE_STATUS_LABELS_PL,
  INVOICE_STATUS_VALUES,
  InvoiceStatus,
  deriveInvoiceStatus,
} from '@/lib/finance/invoice-status'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { polishMonthShort } from '../../domain/stats'

interface InvoiceDetailsPanelProps {
  invoice: Invoice
  client: Client | null
  isTogglingPaid: boolean
  isChangingStatus?: boolean
  onClose?: () => void
  onTogglePaid: () => void
  onChangeStatus?: (status: InvoiceLifecycleStatus) => void
  onEdit: () => void
  onDelete: () => void
}

const STATUS_PILL: Record<InvoiceStatus, string> = {
  [InvoiceStatus.PAID]: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  [InvoiceStatus.SENT]: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  [InvoiceStatus.OVERDUE]: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30',
  [InvoiceStatus.DRAFT]: 'bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30',
  [InvoiceStatus.CANCELLED]: 'bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20',
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${polishMonthShort(d.getMonth())} ${d.getDate()}`
}

export function InvoiceDetailsPanel({
  invoice,
  client,
  isTogglingPaid,
  isChangingStatus,
  onTogglePaid,
  onChangeStatus,
  onEdit,
  onDelete,
}: InvoiceDetailsPanelProps) {
  const status = deriveInvoiceStatus(invoice)
  const numberLabel = displayInvoiceNumber(invoice)
  const issued = formatShortDate(invoice.invoice_date ?? invoice.issue_date ?? null)
  const due = formatShortDate(invoice.due_date)
  const projectName = invoice.billing_period?.trim() || invoice.name?.trim() || '—'

  const net = Number(invoice.net_amount ?? invoice.amount ?? 0)
  const vat = Number(invoice.vat_amount ?? 0)
  const gross = Number(invoice.gross_amount ?? invoice.amount ?? 0)

  const isPaid = invoice.is_paid || status === InvoiceStatus.PAID
  const sentLabel = invoice.invoice_date
    ? `Wysłano · ${formatDate(invoice.invoice_date)}`
    : null
  const draftedLabel = invoice.created_at ? `Utworzono · ${formatDate(invoice.created_at)}` : null
  const paidLabel = invoice.paid_date ? `Opłacono · ${formatDate(invoice.paid_date)}` : null

  const mailHref = client?.email
    ? `mailto:${client.email}?subject=${encodeURIComponent(`Faktura ${numberLabel}`)}`
    : `mailto:?subject=${encodeURIComponent(`Faktura ${numberLabel}`)}`

  return (
    <section className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:p-5">
      <header className="flex items-center justify-between gap-3">
        <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          FAKTURA
        </p>
        {onChangeStatus ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={isChangingStatus}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold transition',
                STATUS_PILL[status],
                isChangingStatus && 'opacity-60',
              )}
              aria-label="Zmień status faktury"
            >
              {INVOICE_STATUS_LABELS_PL[status]}
              <ChevronDown className="h-3 w-3" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuLabel className="text-xs">Zmień status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {INVOICE_STATUS_VALUES.map((option) => (
                <DropdownMenuItem
                  key={option}
                  disabled={option === status}
                  onClick={() => onChangeStatus(option)}
                >
                  <span
                    className={cn(
                      'mr-2 inline-block h-2 w-2 rounded-full',
                      option === InvoiceStatus.PAID && 'bg-emerald-400',
                      option === InvoiceStatus.SENT && 'bg-amber-400',
                      option === InvoiceStatus.OVERDUE && 'bg-red-400',
                      option === InvoiceStatus.DRAFT && 'bg-zinc-400',
                      option === InvoiceStatus.CANCELLED && 'bg-zinc-600',
                    )}
                    aria-hidden
                  />
                  {INVOICE_STATUS_LABELS_PL[option]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold',
              STATUS_PILL[status],
            )}
          >
            {INVOICE_STATUS_LABELS_PL[status]}
          </span>
        )}
      </header>

      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-xl font-semibold tabular-nums text-white">
            {numberLabel}
          </h3>
          {invoice.invoice_number && (
            <p className="truncate text-2xs text-zinc-500">{invoice.name || projectName}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {invoice.file_url && (
            <a
              href={invoice.file_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Pobierz PDF"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#1a1a1a] bg-[#0e0e0e] text-zinc-300 transition hover:border-emerald-500/40 hover:text-emerald-300"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edytuj fakturę"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#1a1a1a] bg-[#0e0e0e] text-zinc-300 transition hover:border-emerald-500/40 hover:text-emerald-300"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(numberLabel)}
            aria-label="Skopiuj numer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#1a1a1a] bg-[#0e0e0e] text-zinc-300 transition hover:border-emerald-500/40 hover:text-emerald-300"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <DetailField label="KLIENT" value={client?.name ?? invoice.recipient ?? 'Bez klienta'} />
        <DetailField label="PROJEKT" value={projectName} />
        <DetailField label="WYSTAWIONA" value={issued} />
        <DetailField label="TERMIN" value={due} />
      </dl>

      <div className="mt-4 rounded-xl border border-[#1a1a1a] bg-[#0e0e0e] p-3">
        <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          POZYCJE
        </p>
        <ul className="mt-2 space-y-2 text-xs">
          <li className="flex items-center justify-between gap-3">
            <span className="truncate text-zinc-200">{projectName}</span>
            <span className="shrink-0 font-medium tabular-nums text-white">
              {formatCurrency(net || gross, invoice.currency)}
            </span>
          </li>
        </ul>
        <div className="mt-3 space-y-1.5 border-t border-[#161616] pt-3 text-xs">
          <Row label="Suma netto" value={formatCurrency(net || gross, invoice.currency)} />
          <Row
            label="VAT"
            value={vat > 0 ? formatCurrency(vat, invoice.currency) : '—'}
            mute={vat <= 0}
          />
          <Row
            label={`Razem · ${invoice.currency}`}
            value={formatCurrency(gross, invoice.currency)}
            strong
          />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[#1a1a1a] bg-[#0e0e0e] p-3">
        <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          AKTYWNOŚĆ
        </p>
        <ul className="mt-2 space-y-1.5 text-xs text-zinc-400">
          {paidLabel && <ActivityRow dot="bg-emerald-400" text={paidLabel} />}
          {sentLabel && <ActivityRow dot="bg-emerald-400" text={sentLabel} />}
          {draftedLabel && <ActivityRow dot="bg-zinc-500" text={draftedLabel} />}
          {!paidLabel && !sentLabel && !draftedLabel && (
            <li className="text-zinc-500">Brak zarejestrowanych zdarzeń.</li>
          )}
        </ul>
      </div>

      <button
        type="button"
        onClick={onTogglePaid}
        disabled={isTogglingPaid}
        className={cn(
          'mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold transition',
          isPaid
            ? 'border border-[#1a1a1a] bg-[#0e0e0e] text-zinc-200 hover:border-amber-500/40 hover:text-amber-300'
            : 'bg-emerald-500 text-black shadow-[0_0_22px_-6px_color-mix(in_oklab,var(--primary)_60%,transparent)] hover:bg-emerald-400',
          isTogglingPaid && 'opacity-60',
        )}
      >
        {isPaid ? (
          <>
            <Clock3 className="h-4 w-4" aria-hidden />
            Cofnij oznaczenie jako opłaconą
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Oznacz jako opłaconą
          </>
        )}
      </button>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <a
          href={mailHref}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#1a1a1a] bg-[#0e0e0e] text-xs font-medium text-zinc-200 transition hover:border-[#262626] hover:text-white"
        >
          <Mail className="h-4 w-4" aria-hidden />
          E-mail
        </a>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#1a1a1a] bg-[#0e0e0e] text-xs font-medium text-zinc-200 transition hover:border-[#262626] hover:text-white"
        >
          <Printer className="h-4 w-4" aria-hidden />
          Drukuj
        </button>
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-transparent text-xs font-medium text-zinc-500 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        Usuń fakturę
      </button>
    </section>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#1a1a1a] bg-[#0e0e0e] p-3">
      <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1.5 truncate text-xs font-medium text-zinc-100">{value}</p>
    </div>
  )
}

function Row({
  label,
  value,
  mute,
  strong,
}: {
  label: string
  value: string
  mute?: boolean
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-zinc-500">{label}</span>
      <span
        className={cn(
          'tabular-nums',
          mute && 'text-zinc-500',
          strong ? 'text-sm font-semibold text-white' : 'text-zinc-200',
        )}
      >
        {value}
      </span>
    </div>
  )
}

function ActivityRow({ dot, text }: { dot: string; text: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} aria-hidden />
      <span>{text}</span>
    </li>
  )
}
