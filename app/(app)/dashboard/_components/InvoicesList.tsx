import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/helpers'

type Invoice = {
  id: string
  name: string
  amount: number
  currency: string
}

export function InvoicesList({ invoices }: { invoices: Invoice[] }) {
  if (!invoices.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Faktury do opłacenia</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {invoices.map((inv) => (
          <div key={inv.id} className="flex justify-between">
            <span>{inv.name}</span>
            <span>{formatCurrency(inv.amount, inv.currency)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}