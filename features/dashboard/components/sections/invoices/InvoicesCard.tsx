'use client'

import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowUpRight,
  Check,
  Clock,
  FileText,
  Pencil,
  Plus,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { formatDate, formatMoney, NO_DATA, toMinor } from '@/lib/format'
import type { Invoice } from '@/lib/types'
import { InvoiceStatus, deriveInvoiceStatus } from '@/lib/finance/invoice-status'
import { sumInvoicesByCurrency } from '@/lib/finance/invoice-currency-totals'

type Props = {
  invoices: Invoice[]
  periodShort: string
}

type StatusKey = 'paid' | 'open' | 'overdue' | 'draft' | 'cancelled'

function statusFromInvoice(inv: Invoice): StatusKey {
  const derived = deriveInvoiceStatus(inv)
  switch (derived) {
    case InvoiceStatus.PAID: return 'paid'
    case InvoiceStatus.OVERDUE: return 'overdue'
    case InvoiceStatus.DRAFT: return 'draft'
    case InvoiceStatus.CANCELLED: return 'cancelled'
    case InvoiceStatus.SENT:
    default: return 'open'
  }
}

const STATUS_PILL: Record<
  StatusKey,
  { label: string; className: string; icon: LucideIcon }
> = {
  paid: {
    label: 'Opłacone',
    className: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
    icon: Check,
  },
  open: {
    label: 'Wystawiona',
    className: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
    icon: Clock,
  },
  overdue: {
    label: 'Zaległe',
    className: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
    icon: Clock,
  },
  draft: {
    label: 'Szkic',
    className: 'bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30',
    icon: Pencil,
  },
  cancelled: {
    label: 'Anulowana',
    className: 'bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20 line-through',
    icon: XCircle,
  },
}

function shortDue(due: string | null | undefined): string {
  const label = formatDate(due?.slice(0, 10), 'dayMonth')
  return label === NO_DATA ? '' : `termin ${label}`
}

export function InvoicesCard({ invoices, periodShort }: Props) {
  const visible = invoices.slice(0, 5)
  const totals = sumInvoicesByCurrency(invoices)

  return (
    <section
      aria-label="Faktury"
      className="rounded-lg border border-hairline bg-surface-1"
    >
      <header className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <div className="flex items-center gap-2">
          <SectionEyebrow>Faktury</SectionEyebrow>
          <span className="rounded-md border border-hairline bg-surface-2 px-2 py-0.5 text-2xs text-zinc-300">
            {invoices.length} · {periodShort}
          </span>
        </div>
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium text-zinc-300 transition hover:bg-surface-3 hover:text-white"
        >
          Zobacz wszystkie
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </Link>
      </header>

      {visible.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-zinc-400">
          Brak faktur.
        </div>
      ) : (
        <ul role="list" className="divide-y divide-hairline">
          {visible.map((inv) => {
            const key = statusFromInvoice(inv)
            const pill = STATUS_PILL[key]
            const recipient = inv.recipient ?? null
            const subtitle = [recipient, shortDue(inv.due_date)]
              .filter(Boolean)
              .join(' · ')
            return (
              <li key={inv.id}>
                <Link
                  href="/invoices"
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-1"
                >
                  <span
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface-2 text-zinc-400"
                  >
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs font-medium leading-[1.35] text-white sm:text-sm">{inv.name}</p>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold ${pill.className}`}
                      >
                        <pill.icon className="h-3 w-3" aria-hidden />
                        {pill.label}
                      </span>
                    </div>
                    {subtitle && (
                      <p className="mt-0.5 truncate text-2xs text-zinc-400 sm:text-xs">{subtitle}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-white sm:text-sm">
                    {formatMoney(toMinor(inv.amount), inv.currency)}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-hairline px-4 py-3">
        <p className="text-xs text-zinc-400">
          Łącznie wystawione ·{' '}
          {totals.length === 0 ? (
            <span className="font-semibold tabular-nums text-white">
              {formatMoney(toMinor(0), 'PLN')}
            </span>
          ) : (
            totals.map((t, index) => (
              <span key={t.currency}>
                {index > 0 && ' · '}
                <span className="font-semibold tabular-nums text-white">
                  {formatMoney(toMinor(t.total), t.currency)}
                </span>
              </span>
            ))
          )}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/invoices?action=new">
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Nowa
          </Link>
        </Button>
      </footer>
    </section>
  )
}
