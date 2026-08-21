'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarRange, Check, Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { cn } from '@/lib/utils'
import { fetchWorkedQuartersAction } from '../../services/actions/worked-quarters.actions'
import type { WorkedQuarterSummary } from '../../services/server/worked-quarters.service.server'
import type { Client } from '@/lib/types'
import type { InvoiceFormValues, InvoiceSettings } from '../../domain'
import { DIALOG_DARK_SURFACE } from '../dialog-theme'

interface QuickQuarterlyInvoiceDialogProps {
  open: boolean
  clients: Client[]
  settings: InvoiceSettings
  isSaving: boolean
  onClose: () => void
  onSubmit: (values: InvoiceFormValues) => Promise<void> | void
}

function formatHours(hours: number) {
  if (!Number.isFinite(hours) || hours === 0) return '0 h'
  return `${hours.toLocaleString('pl-PL', { maximumFractionDigits: 2 })} h`
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
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
        ? `Praca ${selectedQuarter.quarter} ${selectedQuarter.year} (${selectedQuarter.start} – ${selectedQuarter.end}) — ${selectedQuarter.quantity.toLocaleString('pl-PL')} szt.`
        : `Praca ${selectedQuarter.quarter} ${selectedQuarter.year} (${selectedQuarter.start} – ${selectedQuarter.end}) — ${selectedQuarter.hours.toLocaleString('pl-PL')} h`
    const quantity =
      selectedQuarter.workType === 'piecework'
        ? selectedQuarter.quantity || 1
        : selectedQuarter.hours || 1
    const unit_price_net =
      quantity > 0 ? Number((selectedQuarter.amount / quantity).toFixed(2)) : 0
    const lineItem = {
      description,
      unit:           selectedQuarter.workType === 'piecework' ? 'szt.' : 'h',
      quantity:       Number(quantity.toFixed(3)),
      unit_price_net,
      vat_rate:       0,
    }

    const grossTotal = Number(
      (lineItem.quantity * lineItem.unit_price_net * (1 + lineItem.vat_rate / 100)).toFixed(2),
    )

    const values: InvoiceFormValues = {
      name:            `${selectedClient.name} — ${selectedQuarter.quarter} ${selectedQuarter.year}`,
      invoice_number:  '',
      recipient:       selectedClient.name,
      billing_period:  `${selectedQuarter.quarter} ${selectedQuarter.year}`,
      billing_quarter: selectedQuarter.quarter,
      billing_year:    selectedQuarter.year,
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
    <Dialog open={open} onOpenChange={(next) => !next && !isSaving && onClose()}>
      <DialogContent
        className={cn(
          DIALOG_DARK_SURFACE,
          'inset-0 flex h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0',
          'sm:inset-auto sm:top-[50%] sm:left-[50%] sm:h-auto sm:max-h-[90vh] sm:w-[calc(100%-2rem)] sm:max-w-2xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl sm:border',
        )}
      >
        <DialogHeader className="sticky top-0 z-10 border-b bg-background/95 px-5 py-4 text-left backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6">
          <DialogTitle>Wystaw fakturę za kwartał</DialogTitle>
          <DialogDescription>
            Wybierz klienta i kwartał — faktura zostanie wystawiona z agregatem
            wpisów oznaczonych jako „pracowałem” w wybranym okresie.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Klient</Label>
              {clients.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Najpierw dodaj klienta w sekcji „Klienci”, aby wystawić mu fakturę.
                </p>
              ) : (
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz klienta" />
                  </SelectTrigger>
                  <SelectContent className={DIALOG_DARK_SURFACE}>
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
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              Nie udało się pobrać kwartałów: {error instanceof Error ? error.message : 'błąd serwera'}.{' '}
              <button type="button" className="underline" onClick={() => void refetch()}>
                Spróbuj ponownie
              </button>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-md border">
            {!clientId ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                Wybierz klienta, aby zobaczyć przepracowane kwartały.
              </p>
            ) : isBusy ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Ładowanie kwartałów...
              </div>
            ) : quarters.length === 0 ? (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CalendarRange className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>Brak danych do wystawienia</EmptyTitle>
                  <EmptyDescription>
                    Dodaj wpisy w kalendarzu — kwartały bez pracy nie pojawią się tu.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="divide-y divide-hairline" role="list">
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
                            <p className="font-medium">
                              {q.quarter} {q.year}
                            </p>
                            <p className="text-sm font-semibold">
                              {formatAmount(q.amount, q.currency)}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {q.start} – {q.end} · {q.workedDays}{' '}
                            {q.workedDays === 1 ? 'dzień' : 'dni'} · {formatHours(q.hours)}
                          </p>
                          {q.invoiced ? (
                            <p className="mt-0.5 text-xs font-medium text-emerald-400">
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
        </div>

        <DialogFooter className="sticky bottom-0 z-10 border-t bg-background/95 px-5 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6 sm:py-4">
          <Button variant="outline" onClick={onClose} disabled={isSaving} className="h-12 sm:h-10">
            Anuluj
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={isSaving || !selectedQuarter || !selectedClient}
            className="h-12 sm:h-10 sm:px-6"
          >
            {isSaving ? 'Zapisywanie...' : 'Wystaw fakturę'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
