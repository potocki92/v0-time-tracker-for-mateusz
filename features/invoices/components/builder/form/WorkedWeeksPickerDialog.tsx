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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { fetchWorkedWeeksAction } from '@/features/invoices/services/worked-weeks.actions'
import type { WorkedWeekSummary } from '@/features/invoices/services/worked-weeks.service.server'

interface WorkedWeeksPickerDialogProps {
  open: boolean
  clientId: string
  onClose: () => void
  onConfirm: (weeks: WorkedWeekSummary[]) => void
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

/**
 * Lets the user pick one or more ISO weeks of work for a given client and
 * turn each into a single line item on the invoice. The dialog keeps its
 * own range state so the user can probe further back without forcing a
 * full builder reset.
 */
export function WorkedWeeksPickerDialog({
  open,
  clientId,
  onClose,
  onConfirm,
}: WorkedWeeksPickerDialogProps) {
  const [range, setRange] = React.useState(defaultRange)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    if (open) {
      setSelected(new Set())
      setRange(defaultRange())
    }
  }, [open, clientId])

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['invoice-worked-weeks', clientId, range.from, range.to],
    queryFn: () => fetchWorkedWeeksAction({ clientId, from: range.from, to: range.to }),
    enabled: open && Boolean(clientId),
    staleTime: 30_000,
  })

  const weeks = data ?? []

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConfirm = () => {
    const picked = weeks.filter((week) => selected.has(week.id))
    if (picked.length === 0) return
    onConfirm(picked)
  }

  const isBusy = isLoading || isFetching

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Wczytaj z przepracowanych tygodni</DialogTitle>
          <DialogDescription>
            Wybierz tygodnie, które chcesz zafakturować. Każdy zaznaczony tydzień
            doda jedną pozycję na fakturze z sumą godzin i kwotą wyliczoną ze stawki
            klienta.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="weeks-from">Od</Label>
            <Input
              id="weeks-from"
              type="date"
              value={range.from}
              max={range.to}
              onChange={(e) => setRange((prev) => ({ ...prev, from: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="weeks-to">Do</Label>
            <Input
              id="weeks-to"
              type="date"
              value={range.to}
              min={range.from}
              onChange={(e) => setRange((prev) => ({ ...prev, to: e.target.value }))}
            />
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

        <ScrollArea className="max-h-[40vh] rounded-md border">
          {isBusy ? (
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
                  Dla wybranego klienta i zakresu nie znaleźliśmy wpisów ze statusem
                  „pracowałem”. Rozszerz zakres dat lub dodaj wpisy w kalendarzu.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="divide-y" role="list">
              {weeks.map((week) => {
                const checked = selected.has(week.id)
                return (
                  <li key={week.id}>
                    <label
                      className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-muted/40"
                      htmlFor={`week-${week.id}`}
                    >
                      <Checkbox
                        id={`week-${week.id}`}
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
                        {!week.hasRate ? (
                          <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
                            Brak stawki — kwota wyniesie 0. Ustaw stawkę klienta lub wpisz ręcznie.
                          </p>
                        ) : null}
                      </div>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Anuluj</Button>
          <Button onClick={handleConfirm} disabled={selected.size === 0}>
            Wczytaj {selected.size > 0 ? `${selected.size}` : ''}{' '}
            {selected.size === 1 ? 'tydzień' : 'tygodni'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
