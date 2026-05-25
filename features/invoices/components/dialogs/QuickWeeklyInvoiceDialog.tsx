'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarRange, Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
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
import { fetchWorkedWeeksAction } from '../../services/actions/worked-weeks.actions'
import type { WorkedWeekSummary } from '../../services/server/worked-weeks.service.server'
import type { Client } from '@/lib/types'
import type { InvoiceFormValues, InvoiceSettings } from '../../domain'
import { DIALOG_DARK_SURFACE } from '../dialog-theme'

interface QuickWeeklyInvoiceDialogProps {
  open: boolean
  clients: Client[]
  settings: InvoiceSettings
  isSaving: boolean
  onClose: () => void
  onSubmit: (values: InvoiceFormValues) => Promise<void> | void
}

function defaultRange() {
  const now = new Date()
  const from = new Date(now)
  from.setDate(now.getDate() - 60)
  return {
    from: from.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  }
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

function quarterFromIso(iso: string) {
  const month = Number(iso.slice(5, 7))
  if (month <= 3) return 'Q1' as const
  if (month <= 6) return 'Q2' as const
  if (month <= 9) return 'Q3' as const
  return 'Q4' as const
}

/**
 * Streamlined "issue from worked weeks" dialog. Skips the rich builder and
 * goes straight from `(client, weeks) → saveInvoice`. Best used when the
 * data on the client card (NIP, address, rate) is already trustworthy and
 * the user just wants to bill the latest period without any tweaking.
 *
 * The dialog still produces structured `line_items`, so the resulting
 * invoice can later be opened in the full builder for edits.
 */
export function QuickWeeklyInvoiceDialog({
  open,
  clients,
  settings,
  isSaving,
  onClose,
  onSubmit,
}: QuickWeeklyInvoiceDialogProps) {
  const [clientId, setClientId] = React.useState<string>('')
  const [range, setRange] = React.useState(defaultRange)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    if (!open) return
    setSelected(new Set())
    setRange(defaultRange())
    setClientId(clients[0]?.id ?? '')
  }, [open, clients])

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['quick-weekly-invoice', clientId, range.from, range.to],
    queryFn: () => fetchWorkedWeeksAction({ clientId, from: range.from, to: range.to }),
    enabled: open && Boolean(clientId),
    staleTime: 30_000,
  })

  const weeks = data ?? []
  const isBusy = isLoading || isFetching
  const selectedWeeks = React.useMemo(
    () => weeks.filter((w) => selected.has(w.id)),
    [selected, weeks],
  )
  const selectedClient = React.useMemo(
    () => clients.find((c) => c.id === clientId) ?? null,
    [clientId, clients],
  )

  const totalAmount = selectedWeeks.reduce((acc, w) => acc + w.amount, 0)
  const totalCurrency =
    selectedWeeks[0]?.currency ?? selectedClient?.currency ?? 'PLN'

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectLastWeek = () => {
    if (weeks.length === 0) return
    setSelected(new Set([weeks[0].id]))
  }

  const handleSubmit = async () => {
    if (!selectedClient || selectedWeeks.length === 0) return

    const issueDate = new Date().toISOString().slice(0, 10)
    const billingYear = Number(issueDate.slice(0, 4))
    const billingQuarter = quarterFromIso(issueDate)

    const periodStart = selectedWeeks.reduce((min, w) => (w.start < min ? w.start : min), selectedWeeks[0].start)
    const periodEnd = selectedWeeks.reduce((max, w) => (w.end > max ? w.end : max), selectedWeeks[0].end)

    const lineItems = selectedWeeks.map((week) => {
      const description =
        week.workType === 'piecework'
          ? `Praca w tygodniu ${week.id} (${week.start} – ${week.end}) — ${week.quantity.toLocaleString('pl-PL')} szt.`
          : `Praca w tygodniu ${week.id} (${week.start} – ${week.end}) — ${week.hours.toLocaleString('pl-PL')} h`
      const quantity = week.workType === 'piecework' ? week.quantity || 1 : week.hours || 1
      const unit_price_net = quantity > 0 ? Number((week.amount / quantity).toFixed(2)) : 0
      return {
        description,
        unit:           week.workType === 'piecework' ? 'szt.' : 'h',
        quantity:       Number(quantity.toFixed(3)),
        unit_price_net,
        vat_rate:       23,
      }
    })

    const grossTotal = Number(
      lineItems
        .reduce((acc, item) => acc + item.quantity * item.unit_price_net * (1 + item.vat_rate / 100), 0)
        .toFixed(2),
    )

    const values: InvoiceFormValues = {
      name:            `${selectedClient.name} — tygodnie ${periodStart} – ${periodEnd}`,
      invoice_number:  '',
      recipient:       selectedClient.name,
      billing_period:  `TYGODNIE ${periodStart} - ${periodEnd}`,
      billing_quarter: billingQuarter,
      billing_year:    billingYear,
      invoice_date:    issueDate,
      amount:          grossTotal,
      currency:        (selectedClient.currency ?? 'PLN') as InvoiceFormValues['currency'],
      is_paid:         false,
      notes:           'Wystawiona z przepracowanych tygodni.',
      template_key:    settings.defaultTemplate,
      file:            null,
      client_id:       selectedClient.id,
      new_client_name: '',
      buyer: {
        name:         selectedClient.name,
        tax_id:       selectedClient.nip ?? '',
        // Pass through whatever the client has — empty when unset — so the
        // save action doesn't force-overwrite a foreign client's country with
        // a default 'PL'. The PDF / JPK fallback to 'PL' is applied later,
        // only when the value is genuinely missing on the row.
        country_code: selectedClient.country_code?.toUpperCase() ?? '',
        address:      selectedClient.address ?? '',
        city:         selectedClient.city ?? '',
        postal_code:  selectedClient.postal_code ?? '',
        email:        selectedClient.email ?? '',
      },
      line_items: lineItems,
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
          <DialogTitle>Wystaw fakturę z przepracowanych tygodni</DialogTitle>
          <DialogDescription>
            Wybierz klienta z listy i zaznacz tygodnie do zafakturowania. Faktura
            wypełni się danymi z karty klienta i wpisami z kalendarza.
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

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="quick-from">Od</Label>
                <Input
                  id="quick-from"
                  type="date"
                  value={range.from}
                  max={range.to}
                  onChange={(e) => setRange((prev) => ({ ...prev, from: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="quick-to">Do</Label>
                <Input
                  id="quick-to"
                  type="date"
                  value={range.to}
                  min={range.from}
                  onChange={(e) => setRange((prev) => ({ ...prev, to: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              Nie udało się pobrać tygodni: {error instanceof Error ? error.message : 'błąd serwera'}.{' '}
              <button type="button" className="underline" onClick={() => void refetch()}>
                Spróbuj ponownie
              </button>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-md border">
            {!clientId ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                Wybierz klienta, aby zobaczyć przepracowane tygodnie.
              </p>
            ) : isBusy ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Ładowanie tygodni...
              </div>
            ) : weeks.length === 0 ? (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CalendarRange className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>Brak przepracowanych tygodni</EmptyTitle>
                  <EmptyDescription>
                    Rozszerz zakres dat lub dodaj wpisy w kalendarzu — pokażemy tylko
                    tygodnie z dniami oznaczonymi jako „pracowałem”.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="divide-y divide-[#1a1a1a]" role="list">
                {weeks.map((week) => {
                  const checked = selected.has(week.id)
                  return (
                    <li key={week.id}>
                      <label
                        className="flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-[#0e0e0e]"
                        htmlFor={`quick-week-${week.id}`}
                      >
                        <Checkbox
                          id={`quick-week-${week.id}`}
                          checked={checked}
                          onCheckedChange={() => toggle(week.id)}
                          className="mt-1"
                          aria-label={`Zaznacz tydzień ${week.id}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-3">
                            <p className="font-medium">{week.id}</p>
                            <p className="text-sm font-semibold">
                              {formatAmount(week.amount, week.currency)}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {week.start} – {week.end} · {week.workedDays}{' '}
                            {week.workedDays === 1 ? 'dzień' : 'dni'} · {formatHours(week.hours)}
                          </p>
                        </div>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {weeks.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <Button type="button" variant="ghost" size="sm" onClick={handleSelectLastWeek}>
                Zaznacz ostatni tydzień
              </Button>
              {selectedWeeks.length > 0 ? (
                <p className="text-muted-foreground">
                  Suma:{' '}
                  <span className="font-medium text-foreground">
                    {formatAmount(totalAmount, totalCurrency)}
                  </span>{' '}
                  ({selectedWeeks.length} {selectedWeeks.length === 1 ? 'tydzień' : 'tygodni'})
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter className="sticky bottom-0 z-10 border-t bg-background/95 px-5 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6 sm:py-4">
          <Button variant="outline" onClick={onClose} disabled={isSaving} className="h-12 sm:h-10">
            Anuluj
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={isSaving || selectedWeeks.length === 0 || !selectedClient}
            className="h-12 sm:h-10 sm:px-6"
          >
            {isSaving ? 'Zapisywanie...' : 'Wystaw fakturę'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
