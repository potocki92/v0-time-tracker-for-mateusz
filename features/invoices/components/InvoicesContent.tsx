'use client'

import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import type { Invoice } from '@/lib/types'
import type { InvoiceBuilderValues } from '@/lib/schemas/invoice-builder.schema'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { InvoicesHeader } from './InvoicesHeader'
import { InvoicesTable } from './InvoicesTable'
import {
  InvoiceBuilderDialog,
  builderValuesToFormValues,
  invoiceToBuilderValues,
} from './builder'
import { DeleteInvoiceDialog } from './DeleteInvoiceDialog'
import { QuickWeeklyInvoiceDialog } from './QuickWeeklyInvoiceDialog'
import {
  useDeleteInvoice,
  useInvoiceAccountingCsv,
  useInvoicesData,
  useRunAutoIssueInvoices,
  useSaveInvoice,
  useSetInvoicePaidStatus,
} from '../hooks'
import type { InvoiceFormValues } from '../domain'

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

export function InvoicesContent() {
  const { data } = useInvoicesData()
  const saveMutation = useSaveInvoice()
  const deleteMutation = useDeleteInvoice()
  const autoIssueMutation = useRunAutoIssueInvoices()
  const setPaidStatusMutation = useSetInvoicePaidStatus()

  const [formOpen, setFormOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null)
  const [quickWeeksOpen, setQuickWeeksOpen] = useState(false)
  const importInputRef = useRef<HTMLInputElement | null>(null)

  const { exportAccountingCsv, importAccountingCsv } = useInvoiceAccountingCsv({
    invoices: data.invoices,
    clients: data.clients,
  })

  const isSaving = saveMutation.isPending

  const hasInvoices = useMemo(() => data.invoices.length > 0, [data.invoices.length])

  const builderInitialValues = useMemo<InvoiceBuilderValues | undefined>(
    () => (editingInvoice ? invoiceToBuilderValues(editingInvoice) : undefined),
    [editingInvoice],
  )

  const builderDefaults = useMemo(
    () => ({ dueDays: data.settings.dueDays }),
    [data.settings.dueDays],
  )

  function openCreate() {
    setEditingInvoice(null)
    setSelectedClientId(null)
    setFormOpen(true)
  }

  function openEdit(invoice: Invoice) {
    setEditingInvoice(invoice)
    setSelectedClientId(invoice.client_id)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingInvoice(null)
  }

  async function handleBuilderSubmit(values: InvoiceBuilderValues) {
    const payload = builderValuesToFormValues(values, {
      clientId:    selectedClientId,
      settings:    data.settings,
      isPaid:      editingInvoice?.is_paid ?? false,
      templateKey: editingInvoice?.template_key ?? data.settings.defaultTemplate,
    })

    await saveMutation.mutateAsync({
      invoiceId: editingInvoice?.id,
      values:    payload,
    })

    closeForm()
  }

  async function handleDeleteInvoice() {
    if (!deletingInvoice) return
    await deleteMutation.mutateAsync(deletingInvoice.id)
    setDeletingInvoice(null)
  }

  async function handleBulkDelete(invoices: Invoice[]) {
    if (invoices.length === 0) return
    const confirmed =
      typeof window === 'undefined'
        ? true
        : window.confirm(`Usunąć ${invoices.length} ${invoices.length === 1 ? 'fakturę' : 'faktur'}?`)
    if (!confirmed) return

    const results = await Promise.allSettled(
      invoices.map((invoice) => deleteMutation.mutateAsync(invoice.id)),
    )
    const failed = results.filter((result) => result.status === 'rejected').length
    if (failed > 0) {
      toast.error(`Nie udało się usunąć ${failed} ${failed === 1 ? 'faktury' : 'faktur'}.`)
    }
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

  function handleTogglePaid(invoice: Invoice) {
    void setPaidStatusMutation.mutateAsync({
      invoiceId: invoice.id,
      isPaid: !invoice.is_paid,
    })
  }

  async function handleQuickWeeksSubmit(values: InvoiceFormValues) {
    await saveMutation.mutateAsync({ values })
    setQuickWeeksOpen(false)
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
        onCreateFromWeeks={() => setQuickWeeksOpen(true)}
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
          onCreate={openCreate}
          onEdit={openEdit}
          onDelete={setDeletingInvoice}
          onTogglePaid={handleTogglePaid}
          onBulkDelete={handleBulkDelete}
        />
      )}

      <InvoiceBuilderDialog
        open={formOpen}
        isSaving={isSaving}
        initialValues={builderInitialValues}
        defaults={builderDefaults}
        onClose={closeForm}
      onSubmit={handleBuilderSubmit}
      clients={data.clients}
      selectedClientId={selectedClientId}
      onSelectedClientIdChange={setSelectedClientId}
    />

      <DeleteInvoiceDialog
        invoice={deletingInvoice}
        isDeleting={deleteMutation.isPending}
        onClose={() => setDeletingInvoice(null)}
        onConfirm={handleDeleteInvoice}
      />

      <QuickWeeklyInvoiceDialog
        open={quickWeeksOpen}
        clients={data.clients}
        settings={data.settings}
        isSaving={saveMutation.isPending}
        onClose={() => setQuickWeeksOpen(false)}
        onSubmit={handleQuickWeeksSubmit}
      />
    </div>
  )
}
