import { Eye, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/helpers'
import type { Invoice } from '@/lib/types'

interface InvoiceCardProps {
  invoice: Invoice
  clientName: string
  onEdit: (invoice: Invoice) => void
  onDelete: (invoice: Invoice) => void
}

export function InvoiceCard({ invoice, clientName, onEdit, onDelete }: InvoiceCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">{invoice.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Do: {invoice.recipient || 'Nie podano'}</p>
          </div>
          <Badge variant={invoice.is_paid ? 'secondary' : 'outline'} className={invoice.is_paid ? 'text-emerald-700' : 'text-amber-700'}>
            {invoice.is_paid ? 'Opłacona' : 'Nieopłacona'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Kwota</p>
            <p className="font-semibold">{formatCurrency(invoice.amount, invoice.currency)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Klient</p>
            <p className="font-medium">{clientName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Data wystawienia</p>
            <p className="font-medium">{invoice.invoice_date || invoice.issue_date || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Termin płatności</p>
            <p className="font-medium">{invoice.due_date || '-'}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {invoice.file_url && (
            <Button asChild size="sm" variant="outline">
              <a href={invoice.file_url} target="_blank" rel="noreferrer">
                <Eye className="w-4 h-4 mr-1" /> Podgląd PDF
              </a>
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onEdit(invoice)}>
            <Pencil className="w-4 h-4 mr-1" /> Edytuj
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(invoice)}>
            <Trash2 className="w-4 h-4 mr-1" /> Usuń
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
