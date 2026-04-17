'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
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

type SortKey = 'invoice_number' | 'client' | 'invoice_date' | 'status' | 'amount' | 'billing_period'
type SortDirection = 'asc' | 'desc'

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

function getSortValue(invoice: Invoice, key: SortKey, clients: Client[]) {
  if (key === 'invoice_number') return (invoice.invoice_number ?? invoice.id.slice(0, 8)).toLowerCase()
  if (key === 'client') return getClientName(clients, invoice.client_id).toLowerCase()
  if (key === 'invoice_date') return new Date(invoice.invoice_date ?? invoice.issue_date ?? '1970-01-01').getTime()
  if (key === 'status') return invoice.is_paid ? 1 : 0
  if (key === 'amount') return Number(invoice.amount ?? 0)
  return (invoice.billing_period ?? '').toLowerCase()
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
}: {
  label: string
  sortKey: SortKey
  activeKey: SortKey
  direction: SortDirection
  onSort: (key: SortKey) => void
}) {
  const isActive = activeKey === sortKey

  return (
    <Button variant="ghost" className="h-auto p-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground" onClick={() => onSort(sortKey)}>
      {label}
      {isActive ? (direction === 'asc' ? <ArrowUp className="ml-1 size-3" /> : <ArrowDown className="ml-1 size-3" />) : <ArrowUpDown className="ml-1 size-3 opacity-50" />}
    </Button>
  )
}

export function InvoicesTable({ invoices, clients, onEdit, onDelete }: InvoicesTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('invoice_date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  function handleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(nextKey)
    setSortDirection(nextKey === 'amount' ? 'desc' : 'asc')
  }

  const sortedInvoices = useMemo(() => {
    const directionFactor = sortDirection === 'asc' ? 1 : -1

    return [...invoices].sort((left, right) => {
      const leftValue = getSortValue(left, sortKey, clients)
      const rightValue = getSortValue(right, sortKey, clients)

      if (leftValue < rightValue) return -1 * directionFactor
      if (leftValue > rightValue) return 1 * directionFactor
      return 0
    })
  }, [clients, invoices, sortDirection, sortKey])

  return (
    <Card>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortableHeader label="ID" sortKey="invoice_number" activeKey={sortKey} direction={sortDirection} onSort={handleSort} /></TableHead>
                <TableHead><SortableHeader label="Klient" sortKey="client" activeKey={sortKey} direction={sortDirection} onSort={handleSort} /></TableHead>
                <TableHead><SortableHeader label="Data" sortKey="invoice_date" activeKey={sortKey} direction={sortDirection} onSort={handleSort} /></TableHead>
                <TableHead><SortableHeader label="Kwartał" sortKey="billing_period" activeKey={sortKey} direction={sortDirection} onSort={handleSort} /></TableHead>
                <TableHead><SortableHeader label="Status" sortKey="status" activeKey={sortKey} direction={sortDirection} onSort={handleSort} /></TableHead>
                <TableHead><SortableHeader label="Kwota" sortKey="amount" activeKey={sortKey} direction={sortDirection} onSort={handleSort} /></TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number || invoice.id.slice(0, 8)}</TableCell>
                  <TableCell>{getClientName(clients, invoice.client_id)}</TableCell>
                  <TableCell>{formatInvoiceDate(invoice.invoice_date || invoice.issue_date)}</TableCell>
                  <TableCell>{invoice.billing_period || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={invoice.is_paid ? 'secondary' : 'outline'}
                      className={invoice.is_paid ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}
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
        </div>
      </CardContent>
    </Card>
  )
}
