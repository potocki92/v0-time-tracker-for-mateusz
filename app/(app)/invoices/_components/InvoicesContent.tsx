'use client'

import { useMemo, useState } from 'react'
import type { Invoice } from '@/lib/types'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InvoicesHeader } from './InvoicesHeader'
import { InvoicesFilters } from './InvoicesFilters'
import { InvoicesTable } from './InvoicesTable'
import { InvoiceFormDialog } from './InvoiceFormDialog'
import { DeleteInvoiceDialog } from './DeleteInvoiceDialog'
import { useDeleteInvoice, useInvoicesData, useInvoicesFilters, useSaveInvoice } from '../_hooks'
import type { InvoiceFormValues } from '../_domain'

const INITIAL_VALUES: InvoiceFormValues = {
  name: '',
  invoice_number: '',
  recipient: '',
  billing_period: '',
  invoice_date: new Date().toISOString().slice(0, 10),
  amount: 0,
  currency: 'PLN',
  is_paid: false,
  notes: '',
  file: null,
  client_id: null,
  new_client_name: '',
}

export function InvoicesContent() {
  const { data } = useInvoicesData()
  const { filteredInvoices, query, setQuery, setStatus, status } = useInvoicesFilters(data.invoices)

  const saveMutation = useSaveInvoice()
  const deleteMutation = useDeleteInvoice()

  const [formOpen, setFormOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null)
  const [formValues, setFormValues] = useState<InvoiceFormValues>(INITIAL_VALUES)

  const isSaving = saveMutation.isPending

  const hasInvoices = useMemo(() => data.invoices.length > 0, [data.invoices.length])

  function openCreate() {
    setEditingInvoice(null)
    setFormValues({ ...INITIAL_VALUES, invoice_date: new Date().toISOString().slice(0, 10) })
    setFormOpen(true)
  }

  function openEdit(invoice: Invoice) {
    setEditingInvoice(invoice)
    setFormValues({
      name: invoice.name ?? '',
      invoice_number: invoice.invoice_number ?? '',
      recipient: invoice.recipient ?? '',
      billing_period: invoice.billing_period ?? '',
      invoice_date: invoice.invoice_date ?? invoice.issue_date ?? new Date().toISOString().slice(0, 10),
      amount: Number(invoice.amount ?? 0),
      currency: invoice.currency,
      is_paid: invoice.is_paid,
      notes: invoice.notes ?? invoice.note ?? '',
      client_id: invoice.client_id,
      file: null,
      new_client_name: '',
    })
    setFormOpen(true)
  }

  async function handleSaveInvoice() {
    if (!formValues.name.trim()) return
    if (!formValues.invoice_date) return
    if (formValues.amount <= 0) return

    await saveMutation.mutateAsync({ invoiceId: editingInvoice?.id, values: formValues })
    setFormOpen(false)
    setEditingInvoice(null)
    setFormValues(INITIAL_VALUES)
  }

  async function handleDeleteInvoice() {
    if (!deletingInvoice) return
    await deleteMutation.mutateAsync(deletingInvoice.id)
    setDeletingInvoice(null)
  }

  return (
    <div className="container space-y-6 px-4 py-8">
      <InvoicesHeader onCreate={openCreate} />

      <InvoicesFilters query={query} status={status} onQueryChange={setQuery} onStatusChange={setStatus} />

      {filteredInvoices.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText className="size-5" />
            </EmptyMedia>
            <EmptyTitle>{hasInvoices ? 'Brak wyników wyszukiwania' : 'Nie masz jeszcze faktur'}</EmptyTitle>
            <EmptyDescription>
              {hasInvoices
                ? 'Zmień frazę wyszukiwania albo filtr statusu i spróbuj ponownie.'
                : 'Dodaj pierwszą fakturę, aby rozpocząć zarządzanie rozliczeniami.'}
            </EmptyDescription>
          </EmptyHeader>
          {!hasInvoices && <Button onClick={openCreate}>Dodaj pierwszą fakturę</Button>}
        </Empty>
      ) : (
        <InvoicesTable
          invoices={filteredInvoices}
          clients={data.clients}
          onEdit={openEdit}
          onDelete={setDeletingInvoice}
        />
      )}

      <InvoiceFormDialog
        open={formOpen}
        isSaving={isSaving}
        editingInvoice={editingInvoice}
        clients={data.clients}
        values={formValues}
        onOpenChange={setFormOpen}
        onValuesChange={setFormValues}
        onSave={handleSaveInvoice}
      />

      <DeleteInvoiceDialog
        invoice={deletingInvoice}
        isDeleting={deleteMutation.isPending}
        onClose={() => setDeletingInvoice(null)}
        onConfirm={handleDeleteInvoice}
      />
    </div>
  )
}
