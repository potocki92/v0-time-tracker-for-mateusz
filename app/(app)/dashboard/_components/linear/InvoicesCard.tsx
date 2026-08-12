'use client'

import Link from 'next/link'
import {
  ArrowUpRight,
  Check,
  Clock,
  FileText,
  Pencil,
  Plus,
  type LucideIcon,
} from 'lucide-react'
import { formatCurrency } from '@/lib/helpers'
import type { Invoice } from '@/lib/types'
import { sumInvoicesByCurrency } from '@/lib/finance/invoice-currency-totals'

type Props = {
  invoices: Invoice[]
  periodShort: string
}

type StatusKey = 'paid' | 'open' | 'overdue' | 'draft'

function statusFromInvoice(inv: Invoice): StatusKey {
  if (inv.is_paid) return 'paid'
  if (inv.status === 'OVERDUE') return 'overdue'
  if (inv.status === 'DRAFT') return 'draft'
  if (inv.due_date) {
    const t = new Date(inv.due_date).getTime()
    if (!Number.isNaN(t) && t < Date.now()) return 'overdue'
  }
  return 'open'
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
    label: 'Otwarte',
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
}

function shortDue(due: string | null | undefined): string {
  if (!due) return ''
  const d = new Date(due)
  if (Number.isNaN(d.getTime())) return ''
  return `termin ${d.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' })}`
}

export function InvoicesCard({ invoices, periodShort }: Props) {
  const visible = invoices.slice(0, 5)
  const totals = sumInvoicesByCurrency(invoices)

  return (
    <section
      aria-label="Faktury"
      className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]"
    >
      <header className="flex items-center justify-between border-b border-[#161616] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Faktury
          </p>
          <span className="rounded-md border border-[#1a1a1a] bg-[#0e0e0e] px-2 py-0.5 text-[11px] text-zinc-300">
            {invoices.length} · {periodShort}
          </span>
        </div>
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-300 transition hover:bg-[#141414] hover:text-white"
        >
          Zobacz wszystkie
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </Link>
      </header>

      {visible.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-zinc-500 sm:px-5">
          Brak faktur.
        </div>
      ) : (
        <ul role="list" className="divide-y divide-[#161616]">
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
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-[#0c0c0c] sm:px-5"
                >
                  <span
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#1a1a1a] bg-[#0e0e0e] text-zinc-400"
                  >
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-medium leading-[1.35] text-white sm:text-sm">{inv.name}</p>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${pill.className}`}
                      >
                        <pill.icon className="h-3 w-3" aria-hidden />
                        {pill.label}
                      </span>
                    </div>
                    {subtitle && (
                      <p className="mt-0.5 truncate text-[11.5px] text-zinc-500 sm:text-xs">{subtitle}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-[13px] font-semibold tabular-nums text-white sm:text-sm">
                    {formatCurrency(inv.amount, inv.currency)}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-[#161616] px-4 py-3 sm:px-5">
        <p className="text-xs text-zinc-500">
          Łącznie wystawione ·{' '}
          {totals.length === 0 ? (
            <span className="font-semibold tabular-nums text-white">
              {formatCurrency(0, 'PLN')}
            </span>
          ) : (
            totals.map((t, index) => (
              <span key={t.currency}>
                {index > 0 && ' · '}
                <span className="font-semibold tabular-nums text-white">
                  {formatCurrency(t.total, t.currency)}
                </span>
              </span>
            ))
          )}
        </p>
        <Link
          href="/invoices?action=new"
          className="inline-flex items-center gap-1 rounded-lg border border-[#1a1a1a] bg-[#0e0e0e] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Nowa
        </Link>
      </footer>
    </section>
  )
}
