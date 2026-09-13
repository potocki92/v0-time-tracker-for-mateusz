'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
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
import { SURFACE } from '@/components/ui/tokens'
import {
  WORKSPACE_FIELD,
  WORKSPACE_FIELD_LABEL,
  WorkspaceOverlay,
  WorkspaceOverlayBody,
  WorkspaceOverlayFooter,
} from '@/components/workspace'
import { cn } from '@/lib/utils'
import { toMinor } from '@/lib/format'
import { useFormat } from '@/lib/format/client'
import type { Client, ClientRateFormData } from '@/lib/types'
import { useClientRates } from '../hooks/useClientRates'
import {
  useAddClientRate,
  useDeleteClientRate,
} from '../hooks/useClientMutations'

type Props = {
  client: Client | null
  open:   boolean
  onClose: () => void
}

export function RateHistoryDialog({ client, open, onClose }: Props) {
  const fmt = useFormat()
  const { rates, isLoading, isError } = useClientRates(client?.id ?? null)
  const addRate    = useAddClientRate()
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
    <WorkspaceOverlay
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title={`Historia stawek — ${client.name}`}
      size="md"
    >
      <WorkspaceOverlayBody>
        <div className="space-y-4">
          {/* ── Historia ──────────────────────────────────────────────── */}
          <section className="space-y-2">
            <h3 className={WORKSPACE_FIELD_LABEL}>Stawki w czasie</h3>
            {isLoading ? (
              <p className="text-sm text-zinc-400">Ładowanie historii...</p>
            ) : isError ? (
              <p className="rounded-md border border-dashed border-warning-500/40 bg-warning-500/10 p-3 text-xs text-warning-700 dark:text-warning-300">
                Historia niedostępna. Uruchom migrację
                <code className="mx-1 rounded bg-warning-500/15 px-1">
                  supabase/migrations (client_rates)
                </code>
                żeby włączyć śledzenie zmian stawek.
              </p>
            ) : rates.length === 0 ? (
              <CurrentOnly client={client} />
            ) : (
              <ul className={cn(SURFACE.cardNested, 'divide-y divide-hairline-strong')}>
                {rates.map((r) => {
                  const isCurrent = r.effective_to === null
                  return (
                    <li key={r.id} className="flex items-start gap-3 p-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold tabular-nums text-white">
                            {fmt.money(toMinor(r.rate), r.currency)}
                            <span className="text-xs font-normal text-zinc-400">
                              /{r.work_type === 'hourly' ? 'h' : (r.unit ?? 'szt')}
                            </span>
                          </span>
                          {isCurrent && (
                            <Badge variant="secondary" className="text-2xs">Aktualna</Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          Od {r.effective_from}
                          {r.effective_to && ` do ${r.effective_to}`}
                        </p>
                        {r.note && (
                          <p className="mt-1 text-xs italic text-zinc-400">{r.note}</p>
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
          <section className={cn(SURFACE.cardNested, 'space-y-3 p-3')}>
            <h3 className={WORKSPACE_FIELD_LABEL}>Dodaj nową stawkę</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className={WORKSPACE_FIELD_LABEL}>Stawka</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.rate || ''}
                  onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })}
                  placeholder={`np. 28.00 ${client.currency}/${unitLabel}`}
                  className={WORKSPACE_FIELD}
                />
              </div>
              <div className="space-y-1.5">
                <Label className={WORKSPACE_FIELD_LABEL}>Waluta</Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm({ ...form, currency: v as 'PLN' | 'EUR' })}
                >
                  <SelectTrigger className={WORKSPACE_FIELD}>
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
                <Label className={WORKSPACE_FIELD_LABEL}>Typ pracy</Label>
                <Select
                  value={form.work_type}
                  onValueChange={(v) =>
                    setForm({ ...form, work_type: v as 'hourly' | 'piecework' })
                  }
                >
                  <SelectTrigger className={WORKSPACE_FIELD}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Godzinowa</SelectItem>
                    <SelectItem value="piecework">Akordowa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className={WORKSPACE_FIELD_LABEL}>Obowiązuje od</Label>
                <Input
                  type="date"
                  value={form.effective_from}
                  onChange={(e) =>
                    setForm({ ...form, effective_from: e.target.value })
                  }
                  className={WORKSPACE_FIELD}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className={WORKSPACE_FIELD_LABEL}>Notatka (opcjonalnie)</Label>
              <Input
                value={form.note ?? ''}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="np. podwyżka po rocznej współpracy"
                className={WORKSPACE_FIELD}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-hairline bg-surface-2 p-2">
              <div className="pr-3">
                <Label htmlFor="make-current" className="text-sm font-normal text-zinc-200">
                  Ustaw jako aktualną
                </Label>
                <p className="text-xs text-zinc-400">
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
      </WorkspaceOverlayBody>

      <WorkspaceOverlayFooter>
        <Button variant="outline" onClick={onClose} className="h-11 sm:h-9">
          Zamknij
        </Button>
        <Button
          variant="accent"
          onClick={submit}
          disabled={addRate.isPending || form.rate <= 0}
          className="h-11 sm:h-9"
        >
          <Plus className="mr-2 h-4 w-4" />
          {addRate.isPending ? 'Dodawanie...' : 'Dodaj stawkę'}
        </Button>
      </WorkspaceOverlayFooter>
    </WorkspaceOverlay>
  )
}

function CurrentOnly({ client }: { client: Client }) {
  const fmt = useFormat()
  const unit = client.work_type === 'hourly' ? 'h' : (client.unit ?? 'szt')
  return (
    <div className={cn(SURFACE.cardNested, 'p-3')}>
      <div className="flex items-center gap-2">
        <span className="font-semibold tabular-nums text-white">
          {fmt.money(toMinor(client.rate), client.currency)}
          <span className="text-xs font-normal text-zinc-400">/{unit}</span>
        </span>
        <Badge variant="secondary" className="text-2xs">Aktualna</Badge>
      </div>
      <p className="mt-0.5 text-xs text-zinc-400">
        Brak wcześniejszej historii. Dodaj nową stawkę poniżej, żeby rozpocząć śledzenie zmian.
      </p>
    </div>
  )
}
