'use client'

import Link from 'next/link'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/helpers'
import type { Invoice } from '@/lib/types'
import { useMarkInvoicePaid } from '../invoices/InvoicesList.hooks'

type Props = {
  invoices: Invoice[]
}

type StatusKey = 'paid' | 'overdue' | 'open' | 'draft'

function statusFromInvoice(inv: Invoice): StatusKey {
  if (inv.is_paid) return 'paid'
  if (inv.status === 'OVERDUE') return 'overdue'
  if (inv.status === 'DRAFT') return 'draft'
  // due-date based fallback when lifecycle status missing
  if (inv.due_date) {
    const due = new Date(inv.due_date).getTime()
    if (!Number.isNaN(due) && due < Date.now()) return 'overdue'
  }
  return 'open'
}

const STATUS_PILL: Record<StatusKey, { label: string; className: string }> = {
  paid: {
    label: 'Paid',
    className: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  },
  open: {
    label: 'Open',
    className: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
  },
  draft: {
    label: 'Draft',
    className: 'bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/30',
  },
}

export function InvoicesLinear({ invoices }: Props) {
  const { markPaid, isPending, pendingInvoiceId, localHidden } =
    useMarkInvoicePaid()

  const visible = invoices.filter((inv) => !localHidden.has(inv.id))

  return (
    <section
      aria-label="Faktury"
      className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]"
    >
      <header className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-sm font-semibold text-white">Invoices</h2>
          <p className="text-xs text-zinc-500">
            {visible.length === 0
              ? 'Wszystko opłacone'
              : `${visible.length} do opłacenia`}
          </p>
        </div>
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-400 transition hover:bg-[#111] hover:text-white"
        >
          View all
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </header>

      {visible.length === 0 ? (
        <div className="flex items-center justify-center px-4 py-8 text-sm text-zinc-500">
          Nie masz nieopłaconych faktur.
        </div>
      ) : (
        <ul role="list" className="divide-y divide-[#161616]">
          {visible.map((inv) => {
            const key = statusFromInvoice(inv)
            const pill = STATUS_PILL[key]
            const subtitle = inv.billing_period ?? inv.invoice_date ?? null
            const pending = isPending && pendingInvoiceId === inv.id
            return (
              <li
                key={inv.id}
                className="flex items-center gap-3 px-4 py-3 transition-opacity sm:px-5"
                style={{ opacity: pending ? 0.5 : 1 }}
                aria-busy={pending}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-white">
                      {inv.name}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${pill.className}`}
                    >
                      {pill.label}
                    </span>
                  </div>
                  {subtitle && (
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {subtitle}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums text-white">
                    {formatCurrency(inv.amount, inv.currency)}
                  </span>
                  <button
                    type="button"
                    onClick={() => markPaid(inv.id)}
                    disabled={pending}
                    aria-label={`Oznacz fakturę ${inv.name} jako opłaconą`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#1a1a1a] bg-[#0e0e0e] text-zinc-400 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400 disabled:opacity-50"
                  >
                    {pending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    )}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
