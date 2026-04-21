'use client'

import { useMemo, useState, type ChangeEvent } from 'react'
import { ArrowDownAZ, ArrowUpAZ, Check, CheckCircle2, ChevronsUpDown, Clock3, Upload } from 'lucide-react'
import type { Client, Invoice } from '@/lib/types'
import type { BillingQuarter, InvoiceFormValues, InvoiceTemplateKey } from '../_domain'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ClientDisplay } from '@/components/common/ClientDisplay'

interface InvoiceFormDialogProps {
  open: boolean
  isSaving: boolean
  editingInvoice: Invoice | null
  clients: Client[]
  values: InvoiceFormValues
  onOpenChange: (open: boolean) => void
  onValuesChange: (updater: (prev: InvoiceFormValues) => InvoiceFormValues) => void
  onSave: () => void
}

const QUARTERS: BillingQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4']
const TEMPLATES: InvoiceTemplateKey[] = ['classic', 'modern', 'minimal']

export function InvoiceFormDialog({
  open,
  isSaving,
  editingInvoice,
  clients,
  values,
  onOpenChange,
  onValuesChange,
  onSave,
}: InvoiceFormDialogProps) {
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false)
  const [clientQuery, setClientQuery] = useState('')

  const clientDisplayLabel = useMemo(() => {
    if (values.client_id) {
      return clients.find((client) => client.id === values.client_id)?.name ?? 'Wybierz klienta'
    }

    if (values.new_client_name.trim()) {
      return `Nowy klient: ${values.new_client_name.trim()}`
    }

    return 'Bez klienta'
  }, [clients, values.client_id, values.new_client_name])

  const normalizedQuery = clientQuery.trim().toLowerCase()
  const existingNameSet = useMemo(() => new Set(clients.map((client) => client.name.trim().toLowerCase())), [clients])
  const canCreateClient = normalizedQuery.length > 0 && !existingNameSet.has(normalizedQuery)

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    onValuesChange((prev) => ({ ...prev, file }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{editingInvoice ? 'Edytuj fakturę' : 'Nowa faktura'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="invoice-name">Nazwa faktury *</Label>
            <Input
              id="invoice-name"
              value={values.name}
              onChange={(event) => onValuesChange((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="np. Faktura za marzec 2026"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Klient</Label>
              <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="justify-between font-normal">
                    {values.client_id ? (
                      <ClientDisplay
                        client={clients.find((c) => c.id === values.client_id) ?? null}
                        variant="select-item"
                        size="sm"
                        className="min-w-0"
                      />
                    ) : (
                      <span className="truncate">{clientDisplayLabel}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0" align="start">
                  <Command>
                    <CommandInput
                      value={clientQuery}
                      onValueChange={setClientQuery}
                      placeholder="Wyszukaj lub dodaj klienta..."
                    />
                    <CommandList>
                      <CommandEmpty>Brak klientów pasujących do frazy.</CommandEmpty>
                      <CommandGroup heading="Klienci">
                        <CommandItem
                          value="bez-klienta"
                          onSelect={() => {
                            onValuesChange((prev) => ({ ...prev, client_id: null, new_client_name: '', recipient: '' }))
                            setClientQuery('')
                            setClientPopoverOpen(false)
                          }}
                        >
                          <Check className={cn('mr-2 h-4 w-4', !values.client_id && !values.new_client_name ? 'opacity-100' : 'opacity-0')} />
                          Bez klienta
                        </CommandItem>
                        {clients.map((client) => (
                          <CommandItem
                            key={client.id}
                            value={client.name}
                            onSelect={() => {
                              onValuesChange((prev) => ({
                                ...prev,
                                client_id: client.id,
                                new_client_name: '',
                                recipient: client.name,
                              }))
                              setClientQuery('')
                              setClientPopoverOpen(false)
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4 shrink-0', values.client_id === client.id ? 'opacity-100' : 'opacity-0')} />
                            <ClientDisplay client={client} variant="select-item" size="sm" />
                          </CommandItem>
                        ))}
                        {canCreateClient && (
                          <CommandItem
                            value={`new-${clientQuery}`}
                            onSelect={() => {
                              const newClient = clientQuery.trim()
                              onValuesChange((prev) => ({
                                ...prev,
                                client_id: null,
                                new_client_name: newClient,
                                recipient: newClient,
                              }))
                              setClientQuery('')
                              setClientPopoverOpen(false)
                            }}
                          >
                            <ArrowUpAZ className="mr-2 h-4 w-4 text-primary" />
                            Dodaj nowego: {clientQuery.trim()}
                          </CommandItem>
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="invoice-number">Numer faktury</Label>
              <Input
                id="invoice-number"
                value={values.invoice_number}
                onChange={(event) => onValuesChange((prev) => ({ ...prev, invoice_number: event.target.value }))}
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
                value={values.amount || ''}
                onChange={(event) => onValuesChange((prev) => ({ ...prev, amount: Number(event.target.value || 0) }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Waluta</Label>
              <Select
                value={values.currency}
                onValueChange={(value: 'PLN' | 'EUR') => onValuesChange((prev) => ({ ...prev, currency: value }))}
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
                value={values.invoice_date}
                onChange={(event) => onValuesChange((prev) => ({ ...prev, invoice_date: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Szablon</Label>
              <Select
                value={values.template_key}
                onValueChange={(value: InvoiceTemplateKey) => onValuesChange((prev) => ({ ...prev, template_key: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((template) => (
                    <SelectItem key={template} value={template}>
                      {template}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Kwartał</Label>
              <Select
                value={values.billing_quarter}
                onValueChange={(value: BillingQuarter) => onValuesChange((prev) => ({ ...prev, billing_quarter: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUARTERS.map((quarter) => (
                    <SelectItem key={quarter} value={quarter}>
                      {quarter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="billing-year">Rok rozliczeniowy</Label>
              <Input
                id="billing-year"
                type="number"
                min={2000}
                max={2100}
                value={values.billing_year}
                onChange={(event) => onValuesChange((prev) => ({ ...prev, billing_year: Number(event.target.value || new Date().getFullYear()) }))}
              />
            </div>
          </div>

          <div className="rounded-md border border-border/80 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <ArrowDownAZ className="mr-2 inline size-3" />
            Okres rozliczeniowy zostanie zapisany jako: <span className="font-medium text-foreground">{values.billing_quarter} {values.billing_year}</span>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Status płatności</p>
              <p className="text-xs text-muted-foreground">Oznacz fakturę jako opłaconą lub oczekującą.</p>
            </div>
            <div className="flex items-center gap-2">
              {values.is_paid ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Clock3 className="h-4 w-4 text-amber-600" />}
              <Switch checked={values.is_paid} onCheckedChange={(checked) => onValuesChange((prev) => ({ ...prev, is_paid: checked }))} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pdf-upload">Załącz PDF faktury</Label>
            <Input id="pdf-upload" type="file" accept="application/pdf" onChange={handleFileChange} />
            <p className="text-xs text-muted-foreground">Po zapisaniu plik zostanie wysłany do Supabase Storage (bucket: invoices).</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notatki</Label>
            <Textarea
              id="notes"
              value={values.notes}
              onChange={(event) => onValuesChange((prev) => ({ ...prev, notes: event.target.value }))}
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
            <Upload className="mr-2 h-4 w-4" />
            {isSaving ? 'Zapisywanie...' : editingInvoice ? 'Zapisz zmiany' : 'Dodaj fakturę'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
