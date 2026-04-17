import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { Client, Invoice } from '@/lib/types'
import { formatCurrency } from '@/lib/helpers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface InvoicesTableProps {
  invoices: Invoice[]
  clients: Client[]
  onEdit: (invoice: Invoice) => void
  onDelete: (invoice: Invoice) => void
}

function getClientName(clients: Client[], clientId: string | null) {
  if (!clientId) return 'Bez klienta'
  return clients.find((client) => client.id === clientId)?.name ?? 'Nieznany klient'
}

function formatInvoiceDate(date: string | null | undefined) {
  if (!date) return '-'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return '-'

  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed)
}

export function InvoicesTable({ invoices, clients, onEdit, onDelete }: InvoicesTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Klient</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Kwota</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoice_number || invoice.id.slice(0, 8)}</TableCell>
                <TableCell>{getClientName(clients, invoice.client_id)}</TableCell>
                <TableCell>{formatInvoiceDate(invoice.invoice_date || invoice.issue_date)}</TableCell>
                <TableCell>
                  <Badge
                    variant={invoice.is_paid ? 'secondary' : 'outline'}
                    className={invoice.is_paid ? 'text-emerald-700' : 'text-amber-700'}
                  >
                    {invoice.is_paid ? 'Opłacona' : 'Nieopłacona'}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Akcje faktury">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(invoice)}>
                        <Pencil className="size-4" />
                        Edytuj
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => onDelete(invoice)}>
                        <Trash2 className="size-4" />
                        Usuń
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
