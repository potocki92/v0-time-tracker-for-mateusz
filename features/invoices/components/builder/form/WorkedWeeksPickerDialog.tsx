'use client'

import * as React from 'react'
import { toMinor, type Currency } from '@/lib/format'
import type { AppFormat } from '@/lib/format'
import { useFormat } from '@/lib/format/client'
import { useQuery } from '@tanstack/react-query'
import { CalendarRange, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { fetchWorkedWeeksAction } from '../../../services/actions/worked-weeks.actions'
import type { WorkedWeekSummary } from '../../../services/server/worked-weeks.service.server'

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

function formatAmount(fmt: AppFormat, amount: number, currency: string) {
  return fmt.money(toMinor(amount), currency as Currency)
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
  const fmt = useFormat()
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
    <WorkspaceOverlay
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title="Wczytaj z przepracowanych tygodni"
      description="Wybierz tygodnie, które chcesz zafakturować. Każdy zaznaczony tydzień doda jedną pozycję na fakturze z sumą godzin i kwotą wyliczoną ze stawki klienta."
      size="lg"
      layer="stacked"
    >
      <WorkspaceOverlayBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="weeks-from" className={WORKSPACE_FIELD_LABEL}>
                Od
              </Label>
              <Input
                id="weeks-from"
                type="date"
                value={range.from}
                max={range.to}
                onChange={(e) => setRange((prev) => ({ ...prev, from: e.target.value }))}
                className={WORKSPACE_FIELD}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="weeks-to" className={WORKSPACE_FIELD_LABEL}>
                Do
              </Label>
              <Input
                id="weeks-to"
                type="date"
                value={range.to}
                min={range.from}
                onChange={(e) => setRange((prev) => ({ ...prev, to: e.target.value }))}
                className={WORKSPACE_FIELD}
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Nie udało się pobrać tygodni: {error instanceof Error ? error.message : 'błąd serwera'}.{' '}
              <button type="button" className="underline" onClick={() => void refetch()}>
                Spróbuj ponownie
              </button>
            </div>
          ) : null}

          <div className={cn(SURFACE.cardNested, 'overflow-hidden')}>
            {isBusy ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Ładowanie tygodni...
              </div>
            ) : weeks.length === 0 ? (
              <WorkspaceEmptyState
                icon={CalendarRange}
                title="Brak przepracowanych tygodni"
                description="Dla wybranego klienta i zakresu nie znaleźliśmy wpisów ze statusem „pracowałem”. Rozszerz zakres dat lub dodaj wpisy w kalendarzu."
                className="border-0"
              />
            ) : (
              <ul className="divide-y divide-hairline-strong" role="list">
                {weeks.map((week) => {
                  const checked = selected.has(week.id)
                  return (
                    <li key={week.id}>
                      <label
                        className="flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-surface-2"
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
                            <p className="font-medium text-white">{week.id}</p>
                            <p className="text-sm font-semibold tabular-nums text-white">
                              {formatAmount(fmt, week.amount, week.currency)}
                            </p>
                          </div>
                          <p className="text-xs text-zinc-400">
                            {week.start} – {week.end} · {week.workedDays}{' '}
                            {week.workedDays === 1 ? 'dzień' : 'dni'} · {fmt.hours(week.hours)}
                          </p>
                          {!week.hasRate ? (
                            <p className="mt-1 text-xs text-warning-400">
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
          </div>
      </WorkspaceOverlayBody>

      <WorkspaceOverlayFooter>
        <Button variant="outline" onClick={onClose} className="h-11 sm:h-9">
          Anuluj
        </Button>
        <Button
          variant="accent"
          onClick={handleConfirm}
          disabled={selected.size === 0}
          className="h-11 sm:h-9 sm:px-6"
        >
          Wczytaj {selected.size > 0 ? `${selected.size}` : ''}{' '}
          {selected.size === 1 ? 'tydzień' : 'tygodni'}
        </Button>
      </WorkspaceOverlayFooter>
    </WorkspaceOverlay>
  )
}
