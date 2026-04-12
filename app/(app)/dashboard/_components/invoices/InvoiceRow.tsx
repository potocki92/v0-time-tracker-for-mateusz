import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/helpers'
import type { InvoiceRowProps } from './InvoicesList.types'

/**
 * Pojedynczy wiersz faktury.
 * Czysto prezentacyjny — zero logiki mutacji.
 */
export function InvoiceRow({ invoice, isPending, onMarkPaid }: InvoiceRowProps) {
  const subtitle = invoice.billing_period ?? invoice.invoice_date ?? null

  return (
    <div
      className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5 transition-opacity duration-150"
      style={{ opacity: isPending ? 0.5 : 1 }}
      aria-busy={isPending}
    >
      {/* Lewa strona — nazwa + okres */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{invoice.name}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Prawa strona — kwota + przycisk */}
      <div className="ml-3 flex shrink-0 items-center gap-2">
        <span className="text-sm font-semibold tabular-nums">
          {formatCurrency(invoice.amount, invoice.currency)}
        </span>

        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-[var(--chart-1)]/10 hover:text-[var(--chart-1)]"
          onClick={() => onMarkPaid(invoice.id)}
          disabled={isPending}
          aria-label={`Oznacz fakturę ${invoice.name} jako opłaconą`}
        >
          {isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            : <Check className="h-3.5 w-3.5" aria-hidden />
          }
        </Button>
      </div>
    </div>
  )
}