import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { Invoice } from '@/lib/types'
import { formatCurrency } from '@/lib/helpers'
import { sumInvoicesByCurrency, type CurrencyTotal } from '@/lib/finance/invoice-currency-totals'

interface InvoiceStatsProps {
  invoices: Invoice[]
}

function formatTotals(totals: CurrencyTotal[]): string {
  if (totals.length === 0) return formatCurrency(0, 'PLN')
  return totals.map((t) => formatCurrency(t.total, t.currency)).join(' · ')
}

export function InvoiceStats({ invoices }: InvoiceStatsProps) {
  const stats = useMemo(() => {
    const unpaid = invoices.filter((invoice) => !invoice.is_paid)
    const paid = invoices.filter((invoice) => invoice.is_paid)

    return {
      total: invoices.length,
      unpaidCount: unpaid.length,
      unpaidTotals: sumInvoicesByCurrency(unpaid),
      paidTotals: sumInvoicesByCurrency(paid),
    }
  }, [invoices])

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Wszystkie faktury</p>
          <p className="text-2xl font-semibold mt-1">{stats.total}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Nieopłacone</p>
          <p className="text-2xl font-semibold mt-1 text-amber-600">{stats.unpaidCount}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Kwota nieopłacona</p>
          <p className="text-xl font-semibold mt-1">{formatTotals(stats.unpaidTotals)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Kwota opłacona</p>
          <p className="text-xl font-semibold mt-1 text-emerald-600">{formatTotals(stats.paidTotals)}</p>
        </CardContent>
      </Card>
    </div>
  )
}
