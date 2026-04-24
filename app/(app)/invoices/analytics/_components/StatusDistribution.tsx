import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { INVOICE_STATUS_BADGE_CLASS, INVOICE_STATUS_LABELS_PL, INVOICE_STATUS_VALUES, type InvoiceStatus } from '@/lib/finance/invoice-status'

export function StatusDistribution({ distribution }: { distribution: Record<InvoiceStatus, number> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statusy faktur</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {INVOICE_STATUS_VALUES.map((status) => (
            <Badge
              key={status}
              variant="outline"
              className={INVOICE_STATUS_BADGE_CLASS[status]}
            >
              {INVOICE_STATUS_LABELS_PL[status]}: {distribution[status] ?? 0}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
