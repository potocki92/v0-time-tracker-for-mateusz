'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { AlertCircle, FileText, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Client, Invoice } from '@/lib/types'
import { formatCurrency } from '@/lib/helpers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { toast } from 'sonner'
import { InvoiceCard } from '@/components/invoices/invoice-card'
import { InvoiceFormDialog, type InvoiceFormState } from '@/components/invoices/invoice-form-dialog'
import { InvoiceStats } from '@/components/invoices/invoice-stats'
import { uploadInvoicePdf } from '@/services/invoices'

const initialForm: InvoiceFormState = {
  name: '',
  invoice_number: '',
  recipient: '',
  description: '',
  billing_period: '',
  invoice_date: new Date().toISOString().slice(0, 10),
  due_date: '',
  amount: 0,
  currency: 'PLN',
  is_paid: false,
  notes: '',
  client_id: 'none',
  file: null,
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return 'Nieznany błąd'
  }
}

export default function InvoicesPage() {
  const supabase = createClient()

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<Invoice | null>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState<InvoiceFormState>(initialForm)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all')

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      const [invoicesRes, clientsRes] = await Promise.all([
        supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('clients').select('*').eq('user_id', user.id).order('name'),
      ])

      if (invoicesRes.error) throw invoicesRes.error
      if (clientsRes.error) throw clientsRes.error

      setInvoices((invoicesRes.data ?? []) as Invoice[])
      setClients((clientsRes.data ?? []) as Client[])
    } catch (error) {
      console.error('Błąd ładowania faktur:', error)
      toast.error('Nie udało się załadować faktur')
    } finally {
      setIsLoading(false)
    }
  }

  function getClientName(clientId: string | null) {
    if (!clientId) return 'Bez klienta'
    return clients.find((client) => client.id === clientId)?.name ?? 'Nieznany klient'
  }

  function openCreateDialog() {
    setEditingInvoice(null)
    setPreviewUrl(null)
    setFormData({ ...initialForm, invoice_date: new Date().toISOString().slice(0, 10), client_id: 'none' })
    setIsFormDialogOpen(true)
  }

  function openEditDialog(invoice: Invoice) {
    setEditingInvoice(invoice)
    setPreviewUrl(invoice.file_url)
    setFormData({
      name: invoice.name ?? '',
      invoice_number: invoice.invoice_number ?? '',
      recipient: invoice.recipient ?? '',
      description: invoice.description ?? '',
      billing_period: invoice.billing_period ?? '',
      invoice_date: invoice.invoice_date ?? invoice.issue_date ?? new Date().toISOString().slice(0, 10),
      due_date: invoice.due_date ?? '',
      amount: Number(invoice.amount ?? 0),
      currency: invoice.currency,
      is_paid: invoice.is_paid,
      notes: invoice.notes ?? invoice.note ?? '',
      client_id: invoice.client_id ?? 'none',
      file: null,
    })
    setIsFormDialogOpen(true)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null

    if (selectedFile && selectedFile.type !== 'application/pdf') {
      toast.error('Możesz dodać tylko plik PDF')
      return
    }

    setFormData((prev) => ({ ...prev, file: selectedFile }))

    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile)
      setPreviewUrl(objectUrl)
    }
  }

  async function saveInvoice() {
    if (!formData.name.trim()) {
      toast.error('Nazwa faktury jest wymagana')
      return
    }

    if (!formData.invoice_date) {
      toast.error('Data wystawienia jest wymagana')
      return
    }

    if (!formData.amount || formData.amount <= 0) {
      toast.error('Kwota musi być większa od 0')
      return
    }

    setIsSaving(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Brak autoryzacji')
        return
      }

      const pdfUrl = formData.file
        ? await uploadInvoicePdf({
            supabase,
            userId: user.id,
            file: formData.file,
          })
        : editingInvoice?.file_url ?? null

      const payload = {
        user_id: user.id,
        client_id: formData.client_id === 'none' ? null : formData.client_id,
        name: formData.name.trim(),
        invoice_number: formData.invoice_number.trim() || null,
        recipient: formData.recipient.trim() || null,
        description: formData.description.trim() || null,
        billing_period: formData.billing_period.trim() || null,
        issue_date: formData.invoice_date,
        due_date: formData.due_date || null,
        amount: formData.amount,
        currency: formData.currency,
        is_paid: formData.is_paid,
        file_url: pdfUrl,
        notes: formData.notes.trim() || null,
      }

      if (editingInvoice) {
        const { error } = await supabase.from('invoices').update(payload).eq('id', editingInvoice.id)
        if (error) throw error
        toast.success('Faktura została zaktualizowana')
      } else {
        const { error } = await supabase.from('invoices').insert(payload)
        if (error) throw error
        toast.success('Faktura została dodana')
      }

      setIsFormDialogOpen(false)
      await loadData()
    } catch (error) {
      console.error('Błąd zapisu faktury:', error)
      toast.error(`Nie udało się zapisać faktury: ${getErrorMessage(error)}`)
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteInvoice() {
    if (!deleteCandidate) return

    try {
      const { error } = await supabase.from('invoices').delete().eq('id', deleteCandidate.id)
      if (error) throw error

      toast.success('Faktura została usunięta')
      setDeleteCandidate(null)
      await loadData()
    } catch (error) {
      console.error('Błąd usuwania faktury:', error)
      toast.error('Nie udało się usunąć faktury')
    }
  }

  const unpaidInvoices = useMemo(() => invoices.filter((invoice) => !invoice.is_paid), [invoices])

  const filteredInvoices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return invoices.filter((invoice) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' && invoice.is_paid) ||
        (statusFilter === 'unpaid' && !invoice.is_paid)

      if (!matchesStatus) return false

      if (!query) return true

      return [invoice.name, invoice.invoice_number, invoice.recipient]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query))
    })
  }, [invoices, searchQuery, statusFilter])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Ładowanie faktur...</div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-8 space-y-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Faktury</h1>
          <p className="text-muted-foreground">Zarządzaj fakturami, płatnościami oraz załącznikami PDF.</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj fakturę
        </Button>
      </div>

      <InvoiceStats invoices={invoices} />

      {unpaidInvoices.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Faktury oczekujące na płatność
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unpaidInvoices.slice(0, 5).map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between rounded-md bg-background p-3">
                <div>
                  <p className="text-sm font-medium">{invoice.name}</p>
                  <p className="text-xs text-muted-foreground">{invoice.recipient || invoice.billing_period || 'Brak opisu'}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(invoice.amount, invoice.currency)}</p>
                  <p className="text-xs text-muted-foreground">{invoice.invoice_date || invoice.issue_date}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Szukaj po nazwie, numerze lub odbiorcy..."
            />
            <Select value={statusFilter} onValueChange={(value: 'all' | 'paid' | 'unpaid') => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie statusy</SelectItem>
                <SelectItem value="paid">Opłacone</SelectItem>
                <SelectItem value="unpaid">Nieopłacone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredInvoices.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText className="size-5" />
            </EmptyMedia>
            <EmptyTitle>{invoices.length === 0 ? 'Nie masz jeszcze faktur' : 'Brak wyników wyszukiwania'}</EmptyTitle>
            <EmptyDescription>
              {invoices.length === 0
                ? 'Dodaj pierwszą fakturę, załącz PDF i kontroluj płatności.'
                : 'Zmień frazę wyszukiwania albo filtr statusu i spróbuj ponownie.'}
            </EmptyDescription>
          </EmptyHeader>
          {invoices.length === 0 && <Button onClick={openCreateDialog}>Dodaj pierwszą fakturę</Button>}
        </Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              clientName={getClientName(invoice.client_id)}
              onEdit={openEditDialog}
              onDelete={setDeleteCandidate}
            />
          ))}
        </div>
      )}

      <InvoiceFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        formData={formData}
        onFormDataChange={(updater) => setFormData(updater)}
        onFileChange={handleFileChange}
        onSave={saveInvoice}
        clients={clients}
        isSaving={isSaving}
        editingInvoice={editingInvoice}
        previewUrl={previewUrl}
      />

      <Dialog open={!!deleteCandidate} onOpenChange={() => setDeleteCandidate(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Usunąć fakturę?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Ta operacja jest nieodwracalna. Faktura <span className="font-medium text-foreground">{deleteCandidate?.name}</span> zostanie usunięta.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCandidate(null)}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={deleteInvoice}>
              Usuń
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
