'use client'

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import type { Invoice } from '@/lib/types'
import type { InvoiceBuilderValues } from '@/lib/schemas/invoice-builder.schema'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { Bot, CalendarRange, Download, FileText, MoreHorizontal, Upload } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  InvoiceBuilderDialog,
  builderValuesToFormValues,
  invoiceToBuilderValues,
} from '../builder'
import { DeleteInvoiceDialog } from '../dialogs/DeleteInvoiceDialog'
import { QuickQuarterlyInvoiceDialog } from '../dialogs/QuickQuarterlyInvoiceDialog'
import { QuickWeeklyInvoiceDialog } from '../dialogs/QuickWeeklyInvoiceDialog'
import {
  InvoiceARAgingCard,
  InvoiceCashflowCard,
  InvoiceDetailsPanel,
  InvoiceFilterToolbar,
  InvoiceListItem,
  InvoiceStatsGrid,
  InvoicesPageHeader,
} from '../analytics'
import {
  computeInvoicesStats,
  filterInvoicesByTab,
  searchInvoices,
} from '../domain/stats'
import {
  useDeleteInvoice,
  useInvoiceAccountingCsv,
  useInvoiceLineItems,
  useInvoicesData,
  useInvoicesFilters,
  useRunAutoIssueInvoices,
  useSaveInvoice,
  useSetInvoicePaidStatus,
  useUpdateInvoiceStatus,
} from '../hooks'
import { InvoicesPagination } from './InvoicesPagination'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { InvoiceFormValues } from '../domain'
import type { InvoiceLifecycleStatus } from '@/lib/types'

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
  const updateStatusMutation = useUpdateInvoiceStatus()

  const [formOpen, setFormOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null)
  const [quickWeeksOpen, setQuickWeeksOpen] = useState(false)
  const [quickQuarterOpen, setQuickQuarterOpen] = useState(false)
  const { activeTab, setActiveTab, query, setQuery, pageSize, setPageSize } =
    useInvoicesFilters()
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false)
  const importInputRef = useRef<HTMLInputElement | null>(null)

  const { data: editingLineItems, isLoading: editingLineItemsLoading } =
    useInvoiceLineItems(editingInvoice?.id ?? null)

  const { exportAccountingCsv, importAccountingCsv } = useInvoiceAccountingCsv({
    invoices: data.invoices,
    clients: data.clients,
  })

  const isSaving = saveMutation.isPending

  const stats = useMemo(() => computeInvoicesStats(data.invoices), [data.invoices])

  const clientsById = useMemo(
    () => new Map(data.clients.map((client) => [client.id, client])),
    [data.clients],
  )

  const filteredInvoices = useMemo(() => {
    const byCurrency = data.invoices.filter(
      (inv) => (inv.currency ?? 'PLN') === stats.currency,
    )
    const byTab = filterInvoicesByTab(byCurrency, activeTab)
    return searchInvoices(byTab, query).sort((a, b) => {
      const ad = new Date(a.invoice_date ?? a.issue_date ?? a.created_at).getTime()
      const bd = new Date(b.invoice_date ?? b.issue_date ?? b.created_at).getTime()
      return bd - ad
    })
  }, [data.invoices, stats.currency, activeTab, query])

  const pageCount = Math.max(1, Math.ceil(filteredInvoices.length / pageSize))

  useEffect(() => {
    setPageIndex(0)
  }, [activeTab, query, pageSize])

  useEffect(() => {
    if (pageIndex > pageCount - 1) setPageIndex(pageCount - 1)
  }, [pageIndex, pageCount])

  const pagedInvoices = useMemo(
    () => filteredInvoices.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize),
    [filteredInvoices, pageIndex, pageSize],
  )

  useEffect(() => {
    if (pagedInvoices.length === 0) {
      setSelectedInvoiceId(null)
      return
    }
    if (
      !selectedInvoiceId ||
      !pagedInvoices.some((inv) => inv.id === selectedInvoiceId)
    ) {
      setSelectedInvoiceId(pagedInvoices[0].id)
    }
  }, [pagedInvoices, selectedInvoiceId])

  const selectedInvoice =
    pagedInvoices.find((inv) => inv.id === selectedInvoiceId) ?? null
  const selectedClient = selectedInvoice?.client_id
    ? clientsById.get(selectedInvoice.client_id) ?? null
    : null

  const editingClient = editingInvoice?.client_id
    ? clientsById.get(editingInvoice.client_id) ?? null
    : null

  // Compute initial values only once line items have loaded — otherwise we'd
  // seed the form with a single fallback row, then async-replace it once the
  // query settles, wiping any input the user typed in the meantime.
  const builderInitialValues = useMemo<InvoiceBuilderValues | undefined>(() => {
    if (!editingInvoice) return undefined
    if (editingLineItemsLoading) return undefined
    return invoiceToBuilderValues(editingInvoice, {
      lineItems: editingLineItems ?? null,
      client:    editingClient,
    })
  }, [editingInvoice, editingLineItems, editingLineItemsLoading, editingClient])

  // Hold the dialog closed until the initial values are ready in edit mode.
  // Creation flow has no async dependency, so it opens immediately.
  const isBuilderOpen = formOpen && (!editingInvoice || builderInitialValues !== undefined)

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
      clientId: selectedClientId,
      settings: data.settings,
      isPaid: editingInvoice?.is_paid ?? false,
      templateKey: editingInvoice?.template_key ?? data.settings.defaultTemplate,
    })

    await saveMutation.mutateAsync({
      invoiceId: editingInvoice?.id,
      values: payload,
    })

    closeForm()
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

  function handleTogglePaid(invoice: Invoice) {
    void setPaidStatusMutation.mutateAsync({
      invoiceId: invoice.id,
      isPaid: !invoice.is_paid,
    })
  }

  function handleChangeStatus(invoice: Invoice, status: InvoiceLifecycleStatus) {
    if (invoice.status === status) return
    void updateStatusMutation.mutateAsync({ invoiceId: invoice.id, status })
  }

  async function handleQuickWeeksSubmit(values: InvoiceFormValues) {
    await saveMutation.mutateAsync({ values })
    setQuickWeeksOpen(false)
  }

  async function handleQuickQuarterSubmit(values: InvoiceFormValues) {
    await saveMutation.mutateAsync({ values })
    setQuickQuarterOpen(false)
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
      toast.error(
        error instanceof Error ? error.message : 'Nie udało się zaimportować pliku CSV.',
      )
    } finally {
      event.target.value = ''
    }
  }

  const autoIssueBusy = autoIssueMutation.isPending
  const testBusy = saveMutation.isPending && !editingInvoice

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 pb-28 lg:max-w-6xl lg:pb-10">
      <input
        ref={importInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => void handleImportChange(event)}
      />

      <div className="flex items-start justify-between gap-3">
        <InvoicesPageHeader
          monthLabel={stats.monthLabel}
          cycleLabel={stats.cycleLabel}
          currency={stats.currency}
          year={new Date().getFullYear()}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Więcej akcji"
              className="h-10 w-10 shrink-0 rounded-xl border-[#1a1a1a] bg-[#0a0a0a] text-zinc-300 hover:border-[#262626] hover:bg-[#0e0e0e] hover:text-white"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setQuickWeeksOpen(true)}>
              <CalendarRange className="size-4" />
              Wystaw z tygodni
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setQuickQuarterOpen(true)}>
              <CalendarRange className="size-4" />
              Wystaw z kwartału
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => void autoIssueMutation.mutateAsync()}
              disabled={autoIssueBusy}
            >
              <Bot className="size-4" />
              {autoIssueBusy ? 'Generowanie...' : 'Auto-fakturowanie'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => void handleCreateTestInvoice()}
              disabled={testBusy}
            >
              <FileText className="size-4" />
              {testBusy ? 'Tworzenie testu...' : 'Utwórz testową fakturę'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={exportAccountingCsv}>
              <Download className="size-4" />
              Eksport CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleImportClick}>
              <Upload className="size-4" />
              Import CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <InvoiceStatsGrid stats={stats} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InvoiceARAgingCard aging={stats.aging} currency={stats.currency} />
            <InvoiceCashflowCard
              cashflow={stats.cashflow}
              total={stats.cashflowTotal}
              trendPercent={stats.cashflowTrendPercent}
              currency={stats.currency}
            />
          </div>

          <InvoiceFilterToolbar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={stats.counts}
            query={query}
            onQueryChange={setQuery}
            onCreate={openCreate}
          />

          {filteredInvoices.length === 0 ? (
            data.invoices.length === 0 ? (
              <Empty className="rounded-2xl border border-dashed border-[#1f1f1f] bg-[#0a0a0a]">
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
              <div className="rounded-2xl border border-dashed border-[#1f1f1f] bg-[#0a0a0a] px-4 py-10 text-center text-sm text-zinc-500">
                Brak faktur dopasowanych do filtrów.
              </div>
            )
          ) : (
            <>
              <ul className="space-y-2.5">
                {pagedInvoices.map((invoice) => {
                  const client = invoice.client_id
                    ? clientsById.get(invoice.client_id) ?? null
                    : null
                  return (
                    <li key={invoice.id}>
                      <InvoiceListItem
                        invoice={invoice}
                        client={client}
                        selected={invoice.id === selectedInvoiceId}
                        onSelect={() => {
                          setSelectedInvoiceId(invoice.id)
                          setMobileDetailsOpen(true)
                        }}
                      />
                    </li>
                  )
                })}
              </ul>

              <InvoicesPagination
                pageIndex={pageIndex}
                pageCount={pageCount}
                pageSize={pageSize}
                totalCount={filteredInvoices.length}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </div>

        <div className="hidden lg:col-span-5 lg:block">
          {selectedInvoice ? (
            <div className="sticky top-6">
              <InvoiceDetailsPanel
                invoice={selectedInvoice}
                client={selectedClient}
                isTogglingPaid={setPaidStatusMutation.isPending}
                isChangingStatus={updateStatusMutation.isPending}
                onTogglePaid={() => handleTogglePaid(selectedInvoice)}
                onChangeStatus={(status) => handleChangeStatus(selectedInvoice, status)}
                onEdit={() => openEdit(selectedInvoice)}
                onDelete={() => setDeletingInvoice(selectedInvoice)}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#1f1f1f] bg-[#0a0a0a] px-4 py-10 text-center text-sm text-zinc-500">
              Wybierz fakturę z listy, aby zobaczyć szczegóły.
            </div>
          )}
        </div>
      </div>

      <Sheet
        open={mobileDetailsOpen && Boolean(selectedInvoice)}
        onOpenChange={setMobileDetailsOpen}
      >
        <SheetContent
          side="bottom"
          className="max-h-[90dvh] overflow-y-auto rounded-t-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-0 lg:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Szczegóły faktury</SheetTitle>
          </SheetHeader>
          {selectedInvoice && (
            <div className="px-2 pb-[max(env(safe-area-inset-bottom),1rem)] pt-2">
              <InvoiceDetailsPanel
                invoice={selectedInvoice}
                client={selectedClient}
                isTogglingPaid={setPaidStatusMutation.isPending}
                isChangingStatus={updateStatusMutation.isPending}
                onTogglePaid={() => handleTogglePaid(selectedInvoice)}
                onChangeStatus={(status) => handleChangeStatus(selectedInvoice, status)}
                onEdit={() => {
                  setMobileDetailsOpen(false)
                  openEdit(selectedInvoice)
                }}
                onDelete={() => {
                  setMobileDetailsOpen(false)
                  setDeletingInvoice(selectedInvoice)
                }}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <InvoiceBuilderDialog
        // Force a fresh form instance per invoice so RHF picks up the right
        // defaultValues on each open instead of carrying state across edits.
        key={editingInvoice?.id ?? 'new'}
        open={isBuilderOpen}
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

      <QuickQuarterlyInvoiceDialog
        open={quickQuarterOpen}
        clients={data.clients}
        settings={data.settings}
        isSaving={saveMutation.isPending}
        onClose={() => setQuickQuarterOpen(false)}
        onSubmit={handleQuickQuarterSubmit}
      />
    </div>
  )
}
