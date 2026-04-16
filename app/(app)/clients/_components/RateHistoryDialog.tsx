'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
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
import { formatCurrency } from '@/lib/helpers'
import type { Client, ClientRateFormData } from '@/lib/types'
import { useClientRates } from '../_hooks/useClientRates'
import {
  useAddClientRate,
  useDeleteClientRate,
} from '../_hooks/useClientMutations'

type Props = {
  userId: string
  client: Client | null
  open:   boolean
  onClose: () => void
}

export function RateHistoryDialog({ userId, client, open, onClose }: Props) {
  const { rates, isLoading, isError } = useClientRates(userId, client?.id ?? null)
  const addRate    = useAddClientRate(userId)
  const deleteRate = useDeleteClientRate()

  const today = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState<ClientRateFormData>({
    rate:           0,
    currency:       'PLN',
    work_type:      'hourly',
    unit:           'kW',
    effective_from: today,
    note:           '',
  })
  const [makeCurrent, setMakeCurrent] = useState(true)

  if (!client) return null

  function submit() {
    if (!client || form.rate <= 0) return
    addRate.mutate(
      { clientId: client.id, form, makeCurrent },
      {
        onSuccess: () => {
          setForm({
            rate:           0,
            currency:       client?.currency ?? 'PLN',
            work_type:      client?.work_type ?? 'hourly',
            unit:           client?.unit ?? 'kW',
            effective_from: today,
            note:           '',
          })
        },
      },
    )
  }

  const unitLabel = client.work_type === 'hourly' ? 'h' : (client.unit ?? 'szt')

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historia stawek — {client.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* ── Historia ──────────────────────────────────────────────── */}
          <section className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Stawki w czasie
            </h3>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Ładowanie historii...</p>
            ) : isError ? (
              <p className="rounded-md border border-dashed border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30">
                Historia niedostępna. Uruchom migrację
                <code className="mx-1 rounded bg-amber-100 px-1 dark:bg-amber-900">
                  scripts/005_client_rates.sql
                </code>
                żeby włączyć śledzenie zmian stawek.
              </p>
            ) : rates.length === 0 ? (
              <CurrentOnly client={client} />
            ) : (
              <ul className="divide-y rounded-md border">
                {rates.map((r) => {
                  const isCurrent = r.effective_to === null
                  return (
                    <li key={r.id} className="flex items-start gap-3 p-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold tabular-nums">
                            {formatCurrency(r.rate, r.currency)}
                            <span className="text-xs font-normal text-muted-foreground">
                              /{r.work_type === 'hourly' ? 'h' : (r.unit ?? 'szt')}
                            </span>
                          </span>
                          {isCurrent && (
                            <Badge variant="secondary" className="text-[10px]">Aktualna</Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Od {r.effective_from}
                          {r.effective_to && ` do ${r.effective_to}`}
                        </p>
                        {r.note && (
                          <p className="mt-1 text-xs italic text-muted-foreground">{r.note}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteRate.mutate(r.id)}
                        disabled={deleteRate.isPending}
                        title="Usuń wpis"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Usuń</span>
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {/* ── Nowa stawka ─────────────────────────────────────────── */}
          <section className="space-y-3 rounded-md border bg-muted/30 p-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Dodaj nową stawkę
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Stawka</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.rate || ''}
                  onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })}
                  placeholder={`np. 28.00 ${client.currency}/${unitLabel}`}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Waluta</Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm({ ...form, currency: v as 'PLN' | 'EUR' })}
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Typ pracy</Label>
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
              <div className="space-y-1.5">
                <Label>Obowiązuje od</Label>
                <Input
                  type="date"
                  value={form.effective_from}
                  onChange={(e) =>
                    setForm({ ...form, effective_from: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notatka (opcjonalnie)</Label>
              <Input
                value={form.note ?? ''}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="np. podwyżka po rocznej współpracy"
              />
            </div>

            <div className="flex items-center justify-between rounded-md border bg-background p-2">
              <div className="pr-3">
                <Label htmlFor="make-current" className="font-normal">
                  Ustaw jako aktualną
                </Label>
                <p className="text-xs text-muted-foreground">
                  Jeśli włączone — aktualizujemy też pole „stawka” klienta. Inaczej wpis
                  służy tylko jako zapis historyczny.
                </p>
              </div>
              <Switch
                id="make-current"
                checked={makeCurrent}
                onCheckedChange={setMakeCurrent}
              />
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Zamknij</Button>
          <Button onClick={submit} disabled={addRate.isPending || form.rate <= 0}>
            <Plus className="mr-2 h-4 w-4" />
            {addRate.isPending ? 'Dodawanie...' : 'Dodaj stawkę'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CurrentOnly({ client }: { client: Client }) {
  const unit = client.work_type === 'hourly' ? 'h' : (client.unit ?? 'szt')
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center gap-2">
        <span className="font-semibold tabular-nums">
          {formatCurrency(client.rate, client.currency)}
          <span className="text-xs font-normal text-muted-foreground">/{unit}</span>
        </span>
        <Badge variant="secondary" className="text-[10px]">Aktualna</Badge>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Brak wcześniejszej historii. Dodaj nową stawkę poniżej, żeby rozpocząć śledzenie zmian.
      </p>
    </div>
  )
}
