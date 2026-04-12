'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge }              from '@/components/ui/badge'
import { InvoiceRow }         from './InvoiceRow'
import { EmptyInvoices }      from './EmptyInvoices'
import { useMarkInvoicePaid } from './InvoicesList.hooks'
import type { InvoicesListProps } from './InvoicesList.types'

/**
 * Lista faktur do opłacenia z optimistic mark-as-paid.
 * Ten plik: TYLKO kompozycja — zero logiki.
 */
export function InvoicesList({ invoices }: InvoicesListProps) {
  const { markPaid, isPending, pendingInvoiceId, localHidden } =
    useMarkInvoicePaid()

  const visibleInvoices = invoices.filter((inv) => !localHidden.has(inv.id))

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            Faktury do opłacenia
          </CardTitle>
          {visibleInvoices.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {visibleInvoices.length}
            </Badge>
          )}
        </div>
      </CardHeader>

      {visibleInvoices.length === 0 ? (
        <EmptyInvoices />
      ) : (
        <CardContent className="space-y-2 px-3 pb-3">
          {visibleInvoices.map((inv) => (
            <InvoiceRow
              key={inv.id}
              invoice={inv}
              isPending={isPending && pendingInvoiceId === inv.id}
              onMarkPaid={markPaid}
            />
          ))}
        </CardContent>
      )}
    </Card>
  )
}