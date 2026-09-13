'use client'

import * as React from 'react'
import { toMinor, type Currency } from '@/lib/format'
import type { AppFormat } from '@/lib/format'
import { useFormat } from '@/lib/format/client'
import { useQuery } from '@tanstack/react-query'
import { CalendarRange, Check, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SURFACE } from '@/components/ui/tokens'
import {
  WORKSPACE_FIELD,
  WORKSPACE_FIELD_LABEL,
  WorkspaceEmptyState,
  WorkspaceOverlay,
  WorkspaceOverlayBody,
  WorkspaceOverlayFooter,
} from '@/components/workspace'
import { cn } from '@/lib/utils'
import { fetchWorkedQuartersAction } from '../../services/actions/worked-quarters.actions'
import type { WorkedQuarterSummary } from '../../services/server/worked-quarters.service.server'
import type { Client } from '@/lib/types'
import type { InvoiceFormValues, InvoiceSettings } from '../../domain'

interface QuickQuarterlyInvoiceDialogProps {
  open: boolean
  clients: Client[]
  settings: InvoiceSettings
  isSaving: boolean
  onClose: () => void
  onSubmit: (values: InvoiceFormValues) => Promise<void> | void
}

function formatAmount(fmt: AppFormat, amount: number, currency: string) {
  return fmt.money(toMinor(amount), currency as Currency)
}

/**
 * Quarter-based version of `QuickWeeklyInvoiceDialog`. Aggregates worked entries
 * for a calendar quarter into a single line item and produces a `SENT` invoice.
 *
 * Already-invoiced quarters are still listed but visually annotated and
 * disabled so the user can't accidentally double-bill the same period.
 */
export function QuickQuarterlyInvoiceDialog({
  open,
  clients,
  settings,
  isSaving,
  onClose,
  onSubmit,
}: QuickQuarterlyInvoiceDialogProps) {
  const fmt = useFormat()
  const [clientId, setClientId] = React.useState<string>('')
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    setSelectedId(null)
    setClientId(clients[0]?.id ?? '')
  }, [open, clients])

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['quick-quarterly-invoice', clientId],
    queryFn: () => fetchWorkedQuartersAction({ clientId, count: 6 }),
    enabled: open && Boolean(clientId),
    staleTime: 30_000,
  })

  const quarters = data ?? []
  const isBusy = isLoading || isFetching
  const selectedQuarter: WorkedQuarterSummary | null = React.useMemo(
    () => quarters.find((q) => q.id === selectedId) ?? null,
    [quarters, selectedId],
  )
  const selectedClient = React.useMemo(
    () => clients.find((c) => c.id === clientId) ?? null,
    [clientId, clients],
  )

  const handleSubmit = async () => {
    if (!selectedClient || !selectedQuarter) return

    const todayIso = new Date().toISOString().slice(0, 10)
    const description =
      selectedQuarter.workType === 'piecework'
        ? `Praca ${selectedQuarter.quarter} ${selectedQuarter.year} (${selectedQuarter.start} – ${selectedQuarter.end}) — ${fmt.count(selectedQuarter.quantity, ['szt.', 'szt.', 'szt.'])}`
        : `Praca ${selectedQuarter.quarter} ${selectedQuarter.year} (${selectedQuarter.start} – ${selectedQuarter.end}) — ${fmt.hours(selectedQuarter.hours)}`
    const quantity =
      selectedQuarter.workType === 'piecework'
        ? selectedQuarter.quantity || 1
        : selectedQuarter.hours || 1
    const unit_price_net =
      quantity > 0 ? Math.round((selectedQuarter.amount / quantity) * 100) / 100 : 0
    const lineItem = {
      description,
      unit:           selectedQuarter.workType === 'piecework' ? 'szt.' : 'h',
      quantity:       Math.round(quantity * 1000) / 1000,
      unit_price_net,
      vat_rate:       0,
    }

    const grossTotal =
      Math.round(
        lineItem.quantity * lineItem.unit_price_net * (1 + lineItem.vat_rate / 100) * 100,
      ) / 100

    const values: InvoiceFormValues = {
      name:            `${selectedClient.name} — ${selectedQuarter.quarter} ${selectedQuarter.year}`,
      invoice_number:  '',
      recipient:       selectedClient.name,
      billing_period:  `${selectedQuarter.quarter} ${selectedQuarter.year}`,
      billing_quarter: selectedQuarter.quarter,
      billing_year:    selectedQuarter.year,
      // Patrz QuickWeeklyInvoiceDialog — etykieta kwartalu nie wystarczy,
      // wykaz dla ksiegowej czyta `period_start`/`period_end`.
      period_start:    selectedQuarter.start,
      period_end:      selectedQuarter.end,
      invoice_date:    todayIso,
      amount:          grossTotal,
      currency:        (selectedClient.currency ?? selectedQuarter.currency ?? 'PLN') as InvoiceFormValues['currency'],
      is_paid:         false,
      notes:           `Wystawiona z przepracowanego kwartału (${selectedQuarter.start} – ${selectedQuarter.end}).`,
      template_key:    settings.defaultTemplate,
      file:            null,
      client_id:       selectedClient.id,
      new_client_name: '',
      buyer: {
        name:         selectedClient.name,
        tax_id:       selectedClient.nip ?? '',
        // See QuickWeeklyInvoiceDialog — pass through, don't force 'PL'.
        country_code: selectedClient.country_code?.toUpperCase() ?? '',
        address:      selectedClient.address ?? '',
        city:         selectedClient.city ?? '',
        postal_code:  selectedClient.postal_code ?? '',
        email:        selectedClient.email ?? '',
      },
      line_items: [lineItem],
    }

    await onSubmit(values)
  }

  return (
    <WorkspaceOverlay
      open={open}
      onOpenChange={(next) => !next && !isSaving && onClose()}
      title="Wystaw fakturę za kwartał"
      description="Wybierz klienta i kwartał — faktura zostanie wystawiona z agregatem wpisów oznaczonych jako „pracowałem” w wybranym okresie."
      size="lg"
    >
      <WorkspaceOverlayBody className="space-y-4">
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label className={WORKSPACE_FIELD_LABEL}>Klient</Label>
              {clients.length === 0 ? (
                <p className="text-sm text-zinc-400">
                  Najpierw dodaj klienta w sekcji „Klienci”, aby wystawić mu fakturę.
                </p>
              ) : (
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className={WORKSPACE_FIELD}>
                    <SelectValue placeholder="Wybierz klienta" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Nie udało się pobrać kwartałów: {error instanceof Error ? error.message : 'błąd serwera'}.{' '}
              <button type="button" className="underline" onClick={() => void refetch()}>
                Spróbuj ponownie
              </button>
            </div>
          ) : null}

          <div className={cn(SURFACE.cardNested, 'overflow-hidden')}>
            {!clientId ? (
              <p className="px-4 py-10 text-center text-sm text-zinc-400">
                Wybierz klienta, aby zobaczyć przepracowane kwartały.
              </p>
            ) : isBusy ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Ładowanie kwartałów...
              </div>
            ) : quarters.length === 0 ? (
              <WorkspaceEmptyState
                icon={CalendarRange}
                title="Brak danych do wystawienia"
                description="Dodaj wpisy w kalendarzu — kwartały bez pracy nie pojawią się tu."
                className="border-0"
              />
            ) : (
              <ul className="divide-y divide-hairline-strong" role="list">
                {quarters.map((q) => {
                  const disabled = q.invoiced || q.amount <= 0
                  const isSelected = selectedId === q.id
                  return (
                    <li key={q.id}>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelectedId(q.id)}
                        className={cn(
                          'flex w-full items-start gap-3 px-4 py-3 text-left transition',
                          disabled
                            ? 'cursor-not-allowed opacity-60'
                            : 'hover:bg-surface-2',
                          isSelected && 'bg-surface-3',
                        )}
                      >
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border">
                          {isSelected ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-3">
                            <p className="font-medium text-white">
                              {q.quarter} {q.year}
                            </p>
                            <p className="text-sm font-semibold tabular-nums text-white">
                              {formatAmount(fmt, q.amount, q.currency)}
                            </p>
                          </div>
                          <p className="text-xs text-zinc-400">
                            {q.start} – {q.end} · {q.workedDays}{' '}
                            {q.workedDays === 1 ? 'dzień' : 'dni'} · {fmt.hours(q.hours)}
                          </p>
                          {q.invoiced ? (
                            <p className="mt-0.5 text-xs font-medium text-brand-400">
                              Faktura już wystawiona za ten kwartał.
                            </p>
                          ) : null}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
      </WorkspaceOverlayBody>

      <WorkspaceOverlayFooter>
        <Button variant="outline" onClick={onClose} disabled={isSaving} className="h-11 sm:h-9">
          Anuluj
        </Button>
        <Button
          variant="accent"
          onClick={() => void handleSubmit()}
          disabled={isSaving || !selectedQuarter || !selectedClient}
          className="h-11 sm:h-9 sm:px-6"
        >
          {isSaving ? 'Zapisywanie...' : 'Wystaw fakturę'}
        </Button>
      </WorkspaceOverlayFooter>
    </WorkspaceOverlay>
  )
}
