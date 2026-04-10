'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  FileText,
  Plus,
  Upload,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock3,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Client, Invoice } from '@/lib/types'
import { formatCurrency } from '@/lib/helpers'

const INVOICES_BUCKET = 'invoices'

interface InvoiceFormState {
  name: string
  invoice_number: string
  recipient: string
  description: string
  billing_period: string
  invoice_date: string
  due_date: string
  amount: number
  currency: 'PLN' | 'EUR'
  is_paid: boolean
  notes: string
  client_id: string
  file: File | null
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return 'Nieznany blad'
  }
}

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

export default function InvoicesPage() {
  const supabase = createClient()

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<Invoice | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState<InvoiceFormState>(initialForm)

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
      console.error('Blad ladowania faktur:', error)
      toast.error('Nie udalo sie zaladowac faktur')
    } finally {
      setIsLoading(false)
    }
  }

  const stats = useMemo(() => {
    const unpaid = invoices.filter((invoice) => !invoice.is_paid)
    const paid = invoices.filter((invoice) => invoice.is_paid)

    const unpaidAmount = unpaid.reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0)
    const paidAmount = paid.reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0)

    return {
      total: invoices.length,
      unpaidCount: unpaid.length,
      unpaidAmount,
      paidAmount,
    }
  }, [invoices])

  function openCreateModal() {
    setEditingInvoice(null)
    setFormData({ ...initialForm, client_id: 'none', invoice_date: new Date().toISOString().slice(0, 10) })
    setPreviewUrl(null)
    setIsModalOpen(true)
  }

  function openEditModal(invoice: Invoice) {
    setEditingInvoice(invoice)
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
    setPreviewUrl(invoice.file_url)
    setIsModalOpen(true)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null

    if (selectedFile && selectedFile.type !== 'application/pdf') {
      toast.error('Mozesz dodac tylko plik PDF')
      return
    }

    setFormData((prev) => ({ ...prev, file: selectedFile }))

    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile)
      setPreviewUrl(objectUrl)
    }
  }

  async function uploadInvoicePdf(userId: string) {
    if (!formData.file) return editingInvoice?.file_url ?? null

    const safeName = formData.file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
    const filePath = `${userId}/${Date.now()}_${safeName}`

    const { error: uploadError } = await supabase.storage.from(INVOICES_BUCKET).upload(filePath, formData.file, {
      contentType: 'application/pdf',
      upsert: false,
    })

    if (uploadError) {
      throw uploadError
    }

    const { data: publicData } = supabase.storage.from(INVOICES_BUCKET).getPublicUrl(filePath)
    return publicData.publicUrl
  }

  async function saveInvoice() {
    if (!formData.name.trim()) {
      toast.error('Nazwa faktury jest wymagana')
      return
    }

    if (!formData.recipient.trim()) {
      toast.error('Pole "Do kogo" jest wymagane')
      return
    }

    if (!formData.invoice_date) {
      toast.error('Data wystawienia jest wymagana')
      return
    }

    if (!formData.amount || formData.amount <= 0) {
      toast.error('Kwota musi byc wieksza od 0')
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

      const pdfUrl = await uploadInvoicePdf(user.id)

      const payload = {
        user_id: user.id,
        client_id: formData.client_id === 'none' ? null : formData.client_id,
        name: formData.name.trim(),
        invoice_number: formData.invoice_number.trim() || null,
        recipient: formData.recipient.trim(),
        description: formData.description.trim() || null,
        billing_period: formData.billing_period.trim() || null,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date || null,
        amount: formData.amount,
        currency: formData.currency,
        is_paid: formData.is_paid,
        file_url: pdfUrl,
        note: formData.notes.trim() || null,
      }

      if (editingInvoice) {
        const { error } = await supabase.from('invoices').update(payload).eq('id', editingInvoice.id)
        if (error) throw error
        toast.success('Faktura zostala zaktualizowana')
      } else {
        const { error } = await supabase.from('invoices').insert(payload)
        if (error) throw error
        toast.success('Faktura zostala dodana')
      }

      setIsModalOpen(false)
      await loadData()
    } catch (error) {
      console.error('Blad zapisu faktury:', error)
      toast.error(`Nie udalo sie zapisac faktury: ${getErrorMessage(error)}`)
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteInvoice() {
    if (!deleteCandidate) return

    try {
      const { error } = await supabase.from('invoices').delete().eq('id', deleteCandidate.id)
      if (error) throw error

      toast.success('Faktura zostala usunieta')
      setDeleteCandidate(null)
      await loadData()
    } catch (error) {
      console.error('Blad usuwania faktury:', error)
      toast.error('Nie udalo sie usunac faktury')
    }
  }

  function getClientName(clientId: string | null) {
    if (!clientId) return 'Bez klienta'
    return clients.find((client) => client.id === clientId)?.name ?? 'Nieznany klient'
  }

  const unpaidInvoices = useMemo(() => invoices.filter((invoice) => !invoice.is_paid), [invoices])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Ladowanie faktur...</div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Faktury</h1>
          <p className="text-muted-foreground">Nowoczesny panel do zarzadzania fakturami PDF i opisowymi.</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj fakture
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Wszystkie faktury</p>
            <p className="text-2xl font-semibold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Nieoplacone</p>
            <p className="text-2xl font-semibold mt-1 text-amber-600">{stats.unpaidCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Kwota nieoplacona</p>
            <p className="text-xl font-semibold mt-1">{formatCurrency(stats.unpaidAmount, 'PLN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Kwota oplacona</p>
            <p className="text-xl font-semibold mt-1 text-emerald-600">{formatCurrency(stats.paidAmount, 'PLN')}</p>
          </CardContent>
        </Card>
      </div>

      {unpaidInvoices.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Faktury oczekujace na platnosc
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

      {invoices.length === 0 ? (
        <Card className="py-14">
          <CardContent className="text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">Nie masz jeszcze faktur</h2>
            <p className="text-sm text-muted-foreground">Dodaj pierwsza fakture, zalacz PDF i kontroluj platnosci.</p>
            <Button onClick={openCreateModal}>Dodaj pierwsza fakture</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {invoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">{invoice.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Do: {invoice.recipient || 'Nie podano'}</p>
                  </div>
                  <Badge variant={invoice.is_paid ? 'secondary' : 'outline'} className={invoice.is_paid ? 'text-emerald-700' : 'text-amber-700'}>
                    {invoice.is_paid ? 'Oplacona' : 'Nieoplacona'}
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
                    <p className="font-medium">{getClientName(invoice.client_id)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data wystawienia</p>
                    <p className="font-medium">{invoice.invoice_date || invoice.issue_date || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Termin platnosci</p>
                    <p className="font-medium">{invoice.due_date || '-'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {invoice.file_url && (
                    <Button asChild size="sm" variant="outline">
                      <a href={invoice.file_url} target="_blank" rel="noreferrer">
                        <Eye className="w-4 h-4 mr-1" /> Podglad PDF
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => openEditModal(invoice)}>
                    <Pencil className="w-4 h-4 mr-1" /> Edytuj
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteCandidate(invoice)}>
                    <Trash2 className="w-4 h-4 mr-1" /> Usun
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInvoice ? 'Edytuj fakture' : 'Nowa faktura'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="invoice-name">Nazwa faktury *</Label>
              <Input
                id="invoice-name"
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="np. Faktura za marzec 2026"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="recipient">Do kogo *</Label>
                <Input
                  id="recipient"
                  value={formData.recipient}
                  onChange={(event) => setFormData((prev) => ({ ...prev, recipient: event.target.value }))}
                  placeholder="Nazwa firmy / odbiorca"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invoice-number">Numer faktury</Label>
                <Input
                  id="invoice-number"
                  value={formData.invoice_number}
                  onChange={(event) => setFormData((prev) => ({ ...prev, invoice_number: event.target.value }))}
                  placeholder="np. FV/04/2026/01"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Za co / opis faktury</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                rows={3}
                placeholder="Zakres prac, produkty, uslugi..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Kwota *</Label>
                <Input
                  id="amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(event) => setFormData((prev) => ({ ...prev, amount: Number(event.target.value || 0) }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Waluta</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value: 'PLN' | 'EUR') => setFormData((prev) => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLN">PLN</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invoice-date">Data wystawienia *</Label>
                <Input
                  id="invoice-date"
                  type="date"
                  value={formData.invoice_date}
                  onChange={(event) => setFormData((prev) => ({ ...prev, invoice_date: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="due-date">Termin platnosci</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={formData.due_date}
                  onChange={(event) => setFormData((prev) => ({ ...prev, due_date: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Powiazany klient</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData((prev) => ({ ...prev, client_id: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Bez klienta</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="billing-period">Okres rozliczeniowy</Label>
                <Input
                  id="billing-period"
                  value={formData.billing_period}
                  onChange={(event) => setFormData((prev) => ({ ...prev, billing_period: event.target.value }))}
                  placeholder="np. Marzec 2026"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium text-sm">Status platnosci</p>
                <p className="text-xs text-muted-foreground">Oznacz fakture jako oplacona lub oczekujaca.</p>
              </div>
              <div className="flex items-center gap-2">
                {formData.is_paid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock3 className="w-4 h-4 text-amber-600" />}
                <Switch checked={formData.is_paid} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_paid: checked }))} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pdf-upload">Zalacz PDF faktury</Label>
              <Input id="pdf-upload" type="file" accept="application/pdf" onChange={handleFileChange} />
              <p className="text-xs text-muted-foreground">Po zapisaniu plik zostanie wyslany do Supabase Storage (bucket: invoices).</p>
            </div>

            {previewUrl && (
              <div className="space-y-2">
                <Label>Podglad PDF</Label>
                <div className="h-[360px] rounded-xl border overflow-hidden bg-muted/20">
                  <iframe src={previewUrl} className="w-full h-full" title="Podglad PDF faktury" />
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="notes">Notatki</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
                rows={2}
                placeholder="Dodatkowe informacje..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={saveInvoice} disabled={isSaving}>
              <Upload className="w-4 h-4 mr-2" />
              {isSaving ? 'Zapisywanie...' : editingInvoice ? 'Zapisz zmiany' : 'Dodaj fakture'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteCandidate} onOpenChange={() => setDeleteCandidate(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Usunac fakture?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Ta operacja jest nieodwracalna. Faktura <span className="font-medium text-foreground">{deleteCandidate?.name}</span> zostanie usunieta.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCandidate(null)}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={deleteInvoice}>
              Usun
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
