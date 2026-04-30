'use client'

import { useMemo } from 'react'
import type { Client, Invoice } from '@/lib/types'
import { InvoiceCard } from './InvoiceCard'

interface InvoicesMobileListProps {
  invoices: Invoice[]
  clients: Client[]
  onEdit: (invoice: Invoice) => void
  onDelete: (invoice: Invoice) => void
  onTogglePaid: (invoice: Invoice) => void
}

export function InvoicesMobileList({ invoices, clients, onEdit, onDelete, onTogglePaid }: InvoicesMobileListProps) {
  const clientsById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients])

  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-card/60 px-4 py-10 text-center text-sm text-muted-foreground">
        Brak faktur spełniających kryteria.
      </div>
    )
  }

  return (
    <ul className="space-y-2.5">
      {invoices.map((invoice) => {
        const client = invoice.client_id ? clientsById.get(invoice.client_id) ?? null : null
        return (
          <li key={invoice.id}>
            <InvoiceCard
              invoice={invoice}
              client={client}
              onEdit={onEdit}
              onDelete={onDelete}
              onTogglePaid={onTogglePaid}
            />
          </li>
        )
      })}
    </ul>
  )
}
