import { ChangeEvent } from 'react'
import { CheckCircle2, Clock3, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { Client, Invoice } from '@/lib/types'

export interface InvoiceFormState {
  name: string
  invoice_number: string
  recipient: string
  billing_period: string
  invoice_date: string
  amount: number
  currency: 'PLN' | 'EUR'
  is_paid: boolean
  notes: string
  client_id: string
  file: File | null
}

interface InvoiceFormDialogProps {
  open: boolean
  isSaving: boolean
  editingInvoice: Invoice | null
  clients: Client[]
  formData: InvoiceFormState
  previewUrl: string | null
  onOpenChange: (open: boolean) => void
  onFormDataChange: (updater: (prev: InvoiceFormState) => InvoiceFormState) => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onSave: () => void
}

export function InvoiceFormDialog({
  open,
  isSaving,
  editingInvoice,
  clients,
  formData,
  previewUrl,
  onOpenChange,
  onFormDataChange,
  onFileChange,
  onSave,
}: InvoiceFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingInvoice ? 'Edytuj fakturę' : 'Nowa faktura'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="invoice-name">Nazwa faktury *</Label>
            <Input
              id="invoice-name"
              value={formData.name}
              onChange={(event) => onFormDataChange((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="np. Faktura za marzec 2026"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="recipient">Do kogo *</Label>
              <Input
                id="recipient"
                value={formData.recipient}
                onChange={(event) => onFormDataChange((prev) => ({ ...prev, recipient: event.target.value }))}
                placeholder="Nazwa firmy / odbiorca"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoice-number">Numer faktury</Label>
              <Input
                id="invoice-number"
                value={formData.invoice_number}
                onChange={(event) => onFormDataChange((prev) => ({ ...prev, invoice_number: event.target.value }))}
                placeholder="np. FV/04/2026/01"
              />
            </div>
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
                onChange={(event) => onFormDataChange((prev) => ({ ...prev, amount: Number(event.target.value || 0) }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Waluta</Label>
              <Select value={formData.currency} onValueChange={(value: 'PLN' | 'EUR') => onFormDataChange((prev) => ({ ...prev, currency: value }))}>
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
                onChange={(event) => onFormDataChange((prev) => ({ ...prev, invoice_date: event.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Powiązany klient</Label>
              <Select value={formData.client_id} onValueChange={(value) => onFormDataChange((prev) => ({ ...prev, client_id: value }))}>
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
                onChange={(event) => onFormDataChange((prev) => ({ ...prev, billing_period: event.target.value }))}
                placeholder="np. Marzec 2026"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium text-sm">Status płatności</p>
              <p className="text-xs text-muted-foreground">Oznacz fakturę jako opłaconą lub oczekującą.</p>
            </div>
            <div className="flex items-center gap-2">
              {formData.is_paid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock3 className="w-4 h-4 text-amber-600" />}
              <Switch checked={formData.is_paid} onCheckedChange={(checked) => onFormDataChange((prev) => ({ ...prev, is_paid: checked }))} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pdf-upload">Załącz PDF faktury</Label>
            <Input id="pdf-upload" type="file" accept="application/pdf" onChange={onFileChange} />
            <p className="text-xs text-muted-foreground">Po zapisaniu plik zostanie wysłany do Supabase Storage (bucket: invoices).</p>
          </div>

          {previewUrl && (
            <div className="space-y-2">
              <Label>Podgląd PDF</Label>
              <div className="h-[360px] rounded-xl border overflow-hidden bg-muted/20">
                <iframe src={previewUrl} className="w-full h-full" title="Podgląd PDF faktury" />
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="notes">Notatki</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(event) => onFormDataChange((prev) => ({ ...prev, notes: event.target.value }))}
              rows={2}
              placeholder="Dodatkowe informacje..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            <Upload className="w-4 h-4 mr-2" />
            {isSaving ? 'Zapisywanie...' : editingInvoice ? 'Zapisz zmiany' : 'Dodaj fakturę'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
