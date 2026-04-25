'use client'

import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import type { Invoice } from '@/lib/types'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { InvoicesHeader } from './InvoicesHeader'
import { InvoicesTable } from './InvoicesTable'
import { InvoiceBuilderDialog, createDefaultInvoiceBuilderValues } from './_components/builder'
import { DeleteInvoiceDialog } from './DeleteInvoiceDialog'
import {
  useDeleteInvoice,
  useInvoiceAccountingCsv,
  useInvoicesData,
  useRunAutoIssueInvoices,
  useSaveInvoice,
} from '../_hooks'
import type { BillingQuarter, InvoiceFormValues } from '../_domain'

const CURRENT_YEAR = new Date().getFullYear()

const INITIAL_VALUES: InvoiceFormValues = {
  name: '',
  invoice_number: '',
  recipient: '',
  billing_period: '',
  billing_quarter: 'Q1',
  billing_year: CURRENT_YEAR,
  invoice_date: new Date().toISOString().slice(0, 10),
  amount: 0,
  currency: 'PLN',
  is_paid: false,
  notes: '',
  template_key: 'classic',
  file: null,
  client_id: null,
  new_client_name: '',
}

function formatTestInvoiceDateTag(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function parseQuarterPeriod(period: string | null | undefined): { quarter: BillingQuarter; year: number } {
  const fallback = { quarter: 'Q1' as BillingQuarter, year: CURRENT_YEAR }
  if (!period) return fallback

  const match = period.trim().toUpperCase().match(/(Q[1-4])\s*(\d{4})?/)
  if (!match) return fallback

  return {
    quarter: (match[1] as BillingQuarter) ?? fallback.quarter,
    year: match[2] ? Number(match[2]) : fallback.year,
  }
}

export function InvoicesContent() {
  const { data } = useInvoicesData()
  const saveMutation = useSaveInvoice()
  const deleteMutation = useDeleteInvoice()
  const autoIssueMutation = useRunAutoIssueInvoices()

  const [formOpen, setFormOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null)
  const [formValues, setFormValues] = useState<InvoiceFormValues>(INITIAL_VALUES)
  const importInputRef = useRef<HTMLInputElement | null>(null)

  const { exportAccountingCsv, importAccountingCsv } = useInvoiceAccountingCsv({
    invoices: data.invoices,
    clients: data.clients,
  })

  const isSaving = saveMutation.isPending

  const hasInvoices = useMemo(() => data.invoices.length > 0, [data.invoices.length])

  function openCreate() {
    setEditingInvoice(null)
    setFormValues({
      ...INITIAL_VALUES,
      invoice_date: new Date().toISOString().slice(0, 10),
      billing_quarter: 'Q1',
      billing_year: CURRENT_YEAR,
      template_key: data.settings.defaultTemplate,
    })
    setFormOpen(true)
  }

  function openEdit(invoice: Invoice) {
    const { quarter, year } = parseQuarterPeriod(invoice.billing_period)

    setEditingInvoice(invoice)
    setFormValues({
      name: invoice.name ?? '',
      invoice_number: invoice.invoice_number ?? '',
      recipient: invoice.recipient ?? '',
      billing_period: invoice.billing_period ?? '',
      billing_quarter: quarter,
      billing_year: year,
      invoice_date: invoice.invoice_date ?? invoice.issue_date ?? new Date().toISOString().slice(0, 10),
      amount: Number(invoice.amount ?? 0),
      currency: invoice.currency,
      is_paid: invoice.is_paid,
      notes: invoice.notes ?? invoice.note ?? '',
      template_key: invoice.template_key ?? data.settings.defaultTemplate,
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

    await saveMutation.mutateAsync({
      invoiceId: editingInvoice?.id,
      values: {
        ...formValues,
        billing_period: `${formValues.billing_quarter} ${formValues.billing_year}`,
      },
    })
    setFormOpen(false)
    setEditingInvoice(null)
    setFormValues(INITIAL_VALUES)
  }

  async function handleDeleteInvoice() {
    if (!deletingInvoice) return
    await deleteMutation.mutateAsync(deletingInvoice.id)
    setDeletingInvoice(null)
  }

  async function handleCreateTestInvoice() {
    const now = new Date()
    const dateTag = formatTestInvoiceDateTag(now)

    await saveMutation.mutateAsync({
      values: {
        ...INITIAL_VALUES,
        name: `Faktura testowa ${dateTag}`,
        recipient: 'Kontrahent testowy',
        billing_quarter: 'Q1',
        billing_year: now.getFullYear(),
        invoice_date: now.toISOString().slice(0, 10),
        amount: 1,
        currency: 'PLN',
        is_paid: false,
        notes: 'Automatyczny test tworzenia faktury (rekord bez PDF).',
        new_client_name: 'Klient testowy',
        template_key: data.settings.defaultTemplate,
      },
    })
  }

  function handleImportClick() {
    importInputRef.current?.click()
  }

  async function handleImportChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      await importAccountingCsv(file)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nie udało się zaimportować pliku CSV.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="container space-y-6 px-4 py-8">
      <InvoicesHeader
        onCreate={openCreate}
        onExportAccounting={exportAccountingCsv}
        onImportAccounting={handleImportClick}
        onRunAutoIssue={() => void autoIssueMutation.mutateAsync()}
        onCreateTestInvoice={() => void handleCreateTestInvoice()}
        isAutoIssueRunning={autoIssueMutation.isPending}
        isCreatingTestInvoice={saveMutation.isPending && !editingInvoice}
      />

      <input
        ref={importInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => void handleImportChange(event)}
      />

      {!hasInvoices ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText className="size-5" />
            </EmptyMedia>
            <EmptyTitle>Nie masz jeszcze faktur</EmptyTitle>
            <EmptyDescription>
              Dodaj pierwszą fakturę, aby rozpocząć zarządzanie rozliczeniami.
            </EmptyDescription>
          </EmptyHeader>
          <Button onClick={openCreate}>Dodaj pierwszą fakturę</Button>
        </Empty>
      ) : (
        <InvoicesTable
          invoices={data.invoices}
          clients={data.clients}
          onEdit={openEdit}
          onDelete={setDeletingInvoice}
        />
      )}
      builder'

<InvoiceBuilderDialog
  open={formOpen}
  isSaving={mutation.isPending}
  initialValues={editing ? toBuilderValues(editing) : undefined}
  defaults={{ invoiceNumber: nextNumber, dueDays: 14 }}
  onClose={() => setFormOpen(false)}
  onSubmit={async (values) => {
    await mutation.mutateAsync(values) // values: InvoiceBuilderValues, już zwalidowane
    setFormOpen(false)
  }}
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
