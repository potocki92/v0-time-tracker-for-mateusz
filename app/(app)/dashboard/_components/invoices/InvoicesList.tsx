'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/helpers'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Currency } from '../../_domain/dashboard.types'
import { Invoice } from '@/lib/types'

async function markInvoicePaid(invoiceId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('invoices')
    .update({ is_paid: true })
    .eq('id', invoiceId)
  if (error) throw error
}

type Props = {
  invoices: Invoice[]
}

export function InvoicesList({ invoices }: Props) {
  const queryClient = useQueryClient()
  const [optimisticPaid, setOptimisticPaid] = useState<Set<string>>(new Set())

  const { mutate, isPending, variables } = useMutation({
    mutationFn: markInvoicePaid,
    onMutate: (invoiceId) => {
      // Optimistic update
      setOptimisticPaid((prev) => new Set(prev).add(invoiceId))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Faktura oznaczona jako opłacona')
    },
    onError: (_, invoiceId) => {
      // Rollback
      setOptimisticPaid((prev) => {
        const next = new Set(prev)
        next.delete(invoiceId)
        return next
      })
      toast.error('Nie udało się zaktualizować faktury')
    },
  })

  const visibleInvoices = invoices.filter((inv) => !optimisticPaid.has(inv.id))

  if (!visibleInvoices.length) return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-10 text-center">
        <FileText className="mb-2 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-medium">Brak faktur do opłacenia</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Wszystkie faktury są opłacone</p>
      </CardContent>
    </Card>
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Faktury do opłacenia</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {visibleInvoices.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-3 pb-3">
        {visibleInvoices.map((inv) => {
          const isThisPending = isPending && variables === inv.id
          return (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5 transition-opacity"
              style={{ opacity: isThisPending ? 0.6 : 1 }}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{inv.name}</p>
                {(inv.billing_period || inv.invoice_date) && (
                  <p className="text-xs text-muted-foreground">
                    {inv.billing_period ?? inv.invoice_date}
                  </p>
                )}
              </div>
              <div className="ml-3 flex shrink-0 items-center gap-2">
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(inv.amount, inv.currency)}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-[var(--chart-1)]/10 hover:text-[var(--chart-1)]"
                  onClick={() => mutate(inv.id)}
                  disabled={isThisPending}
                  title="Oznacz jako opłaconą"
                >
                  {isThisPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Check className="h-3.5 w-3.5" />
                  }
                </Button>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
