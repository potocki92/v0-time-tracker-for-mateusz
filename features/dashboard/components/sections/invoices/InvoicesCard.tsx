'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Check,
  ChevronRight,
  Clock,
  FileText,
  Pencil,
  Plus,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { DashboardSectionCard } from '@/components/workspace/card/dashboard-section-card'
import { NO_DATA, toMinor } from '@/lib/format'
import type { AppFormat } from '@/lib/format'
import { useFormat } from '@/lib/format/client'
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
    className: 'bg-positive-500/15 text-positive-400 ring-1 ring-positive-500/30',
    icon: Check,
  },
  open: {
    label: 'Wystawiona',
    className: 'bg-warning-500/15 text-warning-300 ring-1 ring-warning-500/30',
    icon: Clock,
  },
  overdue: {
    label: 'Zaległe',
    className: 'bg-danger-500/15 text-danger-400 ring-1 ring-danger-500/30',
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

function shortDue(fmt: AppFormat, due: string | null | undefined): string {
  const label = fmt.date(due?.slice(0, 10), 'dayMonth')
  return label === NO_DATA ? '' : `termin ${label}`
}

export function InvoicesCard({ invoices }: Props) {
  const fmt = useFormat()
  const visible = invoices.slice(0, 5)
  const totals = sumInvoicesByCurrency(invoices)

  return (
    <DashboardSectionCard
      padded={false}
      meta={
        <span className="inline-flex h-5 shrink-0 items-center rounded-full border border-brand-500/30 bg-brand-500/10 px-2 text-2xs font-semibold tabular-nums leading-none text-brand-300">
          {invoices.length}
        </span>
      }
      actions={
        <Link
          href="/invoices"
          className="inline-flex shrink-0 items-center gap-0.5 rounded-md py-1 pl-2 text-2xs font-medium text-zinc-300 transition hover:text-white"
        >
          Zobacz wszystkie
          <ChevronRight className="size-3.5" aria-hidden />
        </Link>
      }
    >

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
            const subtitle = [recipient, shortDue(fmt, inv.due_date)]
              .filter(Boolean)
              .join(' · ')
            return (
              <li key={inv.id}>
                {/* Caly wiersz jest celem — pigulka statusu i kwota nie sa
                    osobnymi klikalnymi wyspami. */}
                <Link
                  href="/invoices"
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-2"
                >
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface-2 text-zinc-400"
                  >
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs font-medium leading-[1.35] text-white sm:text-sm">{inv.name}</p>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold ${pill.className}`}
                      >
                        <pill.icon className="size-3" aria-hidden />
                        {pill.label}
                      </span>
                    </div>
                    {subtitle && (
                      <p className="mt-0.5 truncate text-2xs text-zinc-400 sm:text-xs">{subtitle}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-white sm:text-sm">
                    {fmt.money(toMinor(inv.amount), inv.currency)}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-zinc-500" aria-hidden />
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
              {fmt.money(toMinor(0), 'PLN')}
            </span>
          ) : (
            totals.map((t, index) => (
              <span key={t.currency}>
                {index > 0 && ' · '}
                <span className="font-semibold tabular-nums text-white">
                  {fmt.money(toMinor(t.total), t.currency)}
                </span>
              </span>
            ))
          )}
        </p>
        {/* Wystawienie faktury to akcja glowna tej karty — wariant `accent`,
            ten sam co „Nowa faktura" w sekcji Faktur. */}
        <Button asChild variant="accent" size="sm" className="min-h-10">
          <Link href="/invoices?action=new">
            <Plus className="size-3.5" aria-hidden />
            Nowa
          </Link>
        </Button>
      </footer>
    </DashboardSectionCard>
  )
}
