'use client'

import { useState } from 'react'
import { Download, ExternalLink, MoreHorizontal, Pencil, Send, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ClientDisplay } from '@/components/common/ClientDisplay'
import { formatCurrency } from '@/lib/helpers'
import { displayInvoiceNumber } from '@/lib/finance/invoice-number'
import {
  INVOICE_STATUS_BADGE_CLASS,
  INVOICE_STATUS_LABELS_PL,
  deriveInvoiceStatus,
} from '@/lib/finance/invoice-status'
import type { Client, Invoice } from '@/lib/types'

interface InvoiceCardProps {
  invoice: Invoice
  client: Client | null
  onEdit: (invoice: Invoice) => void
  onDelete: (invoice: Invoice) => void
}

/**
 * Mobile-first invoice card with progressive disclosure:
 * — top row: business number + status badge
 * — middle: client
 * — bottom: bold amount + trigger for the bottom-sheet with secondary actions
 */
export function InvoiceCard({ invoice, client, onEdit, onDelete }: InvoiceCardProps) {
  const [actionsOpen, setActionsOpen] = useState(false)
  const status = deriveInvoiceStatus(invoice)
  const invoiceLabel = displayInvoiceNumber(invoice)

  function withClose(action: () => void) {
    return () => {
      setActionsOpen(false)
      action()
    }
  }

  return (
    <article className="group rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:border-border">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-semibold tabular-nums text-foreground">{invoiceLabel}</p>
          <Badge variant="outline" className={INVOICE_STATUS_BADGE_CLASS[status]}>
            {INVOICE_STATUS_LABELS_PL[status]}
          </Badge>
        </div>

        <Sheet open={actionsOpen} onOpenChange={setActionsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-2 h-9 w-9 shrink-0 text-muted-foreground"
              aria-label={`Więcej akcji dla faktury ${invoiceLabel}`}
            >
              <MoreHorizontal className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="rounded-t-2xl px-0 pb-[max(env(safe-area-inset-bottom),1rem)]"
          >
            <SheetHeader className="pb-2">
              <SheetTitle className="text-base">{invoiceLabel}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col">
              <ActionItem
                icon={<Pencil className="size-4" />}
                label="Edytuj fakturę"
                onClick={withClose(() => onEdit(invoice))}
              />
              {invoice.file_url && (
                <ActionItem
                  icon={<Download className="size-4" />}
                  label="Pobierz PDF"
                  href={invoice.file_url}
                />
              )}
              <ActionItem
                icon={<Send className="size-4" />}
                label="Wyślij do klienta"
                onClick={withClose(() => {
                  window.location.href = `mailto:?subject=${encodeURIComponent(`Faktura ${invoiceLabel}`)}`
                })}
              />
              {invoice.file_url && (
                <ActionItem
                  icon={<ExternalLink className="size-4" />}
                  label="Otwórz w nowej karcie"
                  href={invoice.file_url}
                  external
                />
              )}
              <ActionItem
                icon={<Trash2 className="size-4" />}
                label="Usuń fakturę"
                destructive
                onClick={withClose(() => onDelete(invoice))}
              />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <div className="mt-3">
        <ClientDisplay client={client} variant="row" size="sm" />
      </div>

      <footer className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Do zapłaty</p>
          <p className="mt-0.5 truncate text-lg font-bold tabular-nums text-foreground">
            {formatCurrency(invoice.amount, invoice.currency)}
          </p>
        </div>
        {invoice.billing_period && (
          <span className="shrink-0 text-xs text-muted-foreground">{invoice.billing_period}</span>
        )}
      </footer>
    </article>
  )
}

interface ActionItemProps {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  href?: string
  external?: boolean
  destructive?: boolean
}

function ActionItem({ icon, label, onClick, href, external, destructive }: ActionItemProps) {
  const className =
    'flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/60 ' +
    (destructive ? 'text-destructive' : 'text-foreground')

  if (href) {
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className={className}
      >
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      <span className={destructive ? 'text-destructive' : 'text-muted-foreground'}>{icon}</span>
      {label}
    </button>
  )
}
