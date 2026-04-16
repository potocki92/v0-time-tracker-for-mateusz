'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Pencil, 
  Trash2,
  Star,
  Euro,
  Banknote
} from 'lucide-react'
import { toast } from 'sonner'
import type { Client, ClientFormData } from '@/lib/types'
import { formatCurrency } from '@/lib/helpers'

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16']

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    work_type: 'hourly',
    rate: 0,
    currency: 'PLN',
    unit: 'kW',
    is_default: false,
    color: COLORS[0],
  })

  const supabase = createClient()

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setClients(data)
    setIsLoading(false)
  }

  function openModal(client?: Client) {
    if (client) {
      setEditingClient(client)
      setFormData({
        name: client.name,
        nip: client.nip || undefined,
        regon: client.regon || undefined,
        address: client.address || undefined,
        city: client.city || undefined,
        postal_code: client.postal_code || undefined,
        phone: client.phone || undefined,
        email: client.email || undefined,
        website: client.website || undefined,
        work_type: client.work_type,
        rate: client.rate,
        currency: client.currency,
        unit: client.unit || 'kW',
        is_default: client.is_default,
        color: client.color,
      })
    } else {
      setEditingClient(null)
      setFormData({
        name: '',
        work_type: 'hourly',
        rate: 0,
        currency: 'PLN',
        unit: 'kW',
        is_default: false,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      })
    }
    setIsModalOpen(true)
  }

  async function saveClient() {
    if (!formData.name || formData.rate <= 0) {
      toast.error('Wypełnij wymagane pola')
      return
    }

    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // If setting as default, unset other defaults first
    if (formData.is_default) {
      await supabase
        .from('clients')
        .update({ is_default: false })
        .eq('user_id', user.id)
    }

    const clientData = {
      user_id: user.id,
      name: formData.name,
      nip: formData.nip || null,
      regon: formData.regon || null,
      address: formData.address || null,
      city: formData.city || null,
      postal_code: formData.postal_code || null,
      phone: formData.phone || null,
      email: formData.email || null,
      website: formData.website || null,
      work_type: formData.work_type,
      rate: formData.rate,
      currency: formData.currency,
      unit: formData.work_type === 'piecework' ? formData.unit : null,
      is_default: formData.is_default,
      color: formData.color,
    }

    let error
    if (editingClient) {
      const res = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', editingClient.id)
      error = res.error
    } else {
      const res = await supabase
        .from('clients')
        .insert(clientData)
      error = res.error
    }

    if (error) {
      toast.error('Błąd podczas zapisywania')
    } else {
      toast.success(editingClient ? 'Zaktualizowano klienta' : 'Dodano klienta')
      await loadClients()
      setIsModalOpen(false)
    }

    setIsSaving(false)
  }

  async function deleteClient(id: string) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Błąd podczas usuwania')
    } else {
      toast.success('Usunięto klienta')
      await loadClients()
    }
    setDeleteConfirm(null)
  }

  return (
    <div className="container px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Klienci</h1>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj klienta
        </Button>
      </div>

      {/* Clients List */}
      {clients.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">Nie masz jeszcze żadnych klientów</p>
            <Button onClick={() => openModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Dodaj pierwszego klienta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="relative overflow-hidden">
              <div 
                className="absolute top-0 left-0 w-1 h-full" 
                style={{ backgroundColor: client.color }}
              />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {client.name}
                      {client.is_default && (
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {client.work_type === 'hourly' ? 'Godzinowa' : 'Akordowa'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {client.currency === 'EUR' ? (
                          <Euro className="w-3 h-3 mr-1" />
                        ) : (
                          <Banknote className="w-3 h-3 mr-1" />
                        )}
                        {client.currency}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openModal(client)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteConfirm(client.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(client.rate, client.currency)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{client.work_type === 'hourly' ? 'h' : client.unit}
                  </span>
                </div>
                {client.email && (
                  <p className="text-sm text-muted-foreground mt-2 truncate">{client.email}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Edytuj klienta' : 'Nowy klient'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="space-y-2">
              <Label>Nazwa *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nazwa firmy lub klienta"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NIP</Label>
                <Input
                  value={formData.nip || ''}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  placeholder="1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label>REGON</Label>
                <Input
                  value={formData.regon || ''}
                  onChange={(e) => setFormData({ ...formData, regon: e.target.value })}
                  placeholder="123456789"
                />
              </div>
            </div>

            {/* Rate Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Typ pracy *</Label>
                <Select 
                  value={formData.work_type} 
                  onValueChange={(v) => setFormData({ ...formData, work_type: v as 'hourly' | 'piecework' })}
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
                  value={formData.currency} 
                  onValueChange={(v) => setFormData({ ...formData, currency: v as 'PLN' | 'EUR' })}
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
                <Label>Stawka *</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                />
              </div>
              {formData.work_type === 'piecework' && (
                <div className="space-y-2">
                  <Label>Jednostka *</Label>
                  <Input
                    value={formData.unit || ''}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="kW, szt, m2..."
                  />
                </div>
              )}
            </div>

            {/* Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Kolor</Label>
              <div className="flex gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      formData.color === color ? 'scale-110 border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            {/* Default */}
            <div className="flex items-center justify-between">
              <Label>Ustaw jako domyślnego klienta</Label>
              <Switch
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={saveClient} disabled={isSaving}>
              {isSaving ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Usunąć klienta?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Tej operacji nie można cofnąć. Wszystkie powiązane projekty również zostaną usunięte.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteClient(deleteConfirm)}>
              Usuń
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
