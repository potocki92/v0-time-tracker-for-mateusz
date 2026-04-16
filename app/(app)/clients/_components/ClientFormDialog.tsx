'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import type { Client, ClientFormData } from '@/lib/types'
import { CLIENT_COLORS } from '../_domain/clients.constants'

type Props = {
  open:          boolean
  client:        Client | null
  isSaving:      boolean
  onClose:       () => void
  onSubmit:      (form: ClientFormData) => void
}

const EMPTY: ClientFormData = {
  name:       '',
  work_type:  'hourly',
  rate:       0,
  currency:   'PLN',
  unit:       'kW',
  is_default: false,
  color:      CLIENT_COLORS[0],
}

function fromClient(c: Client): ClientFormData {
  return {
    name:        c.name,
    nip:         c.nip ?? undefined,
    regon:       c.regon ?? undefined,
    address:     c.address ?? undefined,
    city:        c.city ?? undefined,
    postal_code: c.postal_code ?? undefined,
    phone:       c.phone ?? undefined,
    email:       c.email ?? undefined,
    website:     c.website ?? undefined,
    work_type:   c.work_type,
    rate:        c.rate,
    currency:    c.currency,
    unit:        c.unit ?? 'kW',
    is_default:  c.is_default,
    color:       c.color,
  }
}

export function ClientFormDialog({
  open,
  client,
  isSaving,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<ClientFormData>(EMPTY)

  useEffect(() => {
    if (!open) return
    if (client) {
      setForm(fromClient(client))
    } else {
      setForm({
        ...EMPTY,
        color: CLIENT_COLORS[Math.floor(Math.random() * CLIENT_COLORS.length)],
      })
    }
  }, [open, client])

  function submit() {
    if (!form.name.trim()) {
      toast.error('Podaj nazwę klienta')
      return
    }
    if (form.rate <= 0) {
      toast.error('Stawka musi być większa niż 0')
      return
    }
    onSubmit(form)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? 'Edytuj klienta' : 'Nowy klient'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">Nazwa *</Label>
            <Input
              id="client-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nazwa firmy lub klienta"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>NIP</Label>
              <Input
                value={form.nip ?? ''}
                onChange={(e) => setForm({ ...form, nip: e.target.value })}
                placeholder="1234567890"
              />
            </div>
            <div className="space-y-2">
              <Label>REGON</Label>
              <Input
                value={form.regon ?? ''}
                onChange={(e) => setForm({ ...form, regon: e.target.value })}
                placeholder="123456789"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Typ pracy *</Label>
              <Select
                value={form.work_type}
                onValueChange={(v) =>
                  setForm({ ...form, work_type: v as 'hourly' | 'piecework' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Godzinowa</SelectItem>
                  <SelectItem value="piecework">Akordowa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Waluta *</Label>
              <Select
                value={form.currency}
                onValueChange={(v) =>
                  setForm({ ...form, currency: v as 'PLN' | 'EUR' })
                }
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Aktualna stawka *</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })}
              />
              {client && (
                <p className="text-xs text-muted-foreground">
                  Edycja nadpisuje aktualną stawkę. Aby dodać nową stawkę obowiązującą od daty
                  (bez utraty historii) — użyj przycisku „Historia stawek”.
                </p>
              )}
            </div>
            {form.work_type === 'piecework' && (
              <div className="space-y-2">
                <Label>Jednostka *</Label>
                <Input
                  value={form.unit ?? ''}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="kW, szt, m2..."
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email ?? ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                value={form.phone ?? ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Kolor</Label>
            <div className="flex flex-wrap gap-2">
              {CLIENT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Kolor ${color}`}
                  aria-pressed={form.color === color}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${
                    form.color === color
                      ? 'scale-110 border-foreground'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setForm({ ...form, color })}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="client-default">Ustaw jako domyślnego klienta</Label>
            <Switch
              id="client-default"
              checked={form.is_default}
              onCheckedChange={(v) => setForm({ ...form, is_default: v })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Anuluj
          </Button>
          <Button onClick={submit} disabled={isSaving}>
            {isSaving ? 'Zapisywanie...' : 'Zapisz'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
