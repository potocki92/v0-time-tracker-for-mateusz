'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { formatPlLongDate, todayIsoUtc, type Trip } from '../domain'
import type { UseTripsResult } from '../hooks'

interface TripManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trips: Trip[]
  api: Pick<UseTripsResult, 'addTrip' | 'updateTrip' | 'removeTrip'>
}

interface DraftTrip {
  startDate: string
  endDate: string
  destination: string
}

function emptyDraft(): DraftTrip {
  const today = todayIsoUtc()
  return { startDate: today, endDate: today, destination: '' }
}

export function TripManagerDialog({
  open,
  onOpenChange,
  trips,
  api,
}: TripManagerDialogProps) {
  const [draft, setDraft] = useState<DraftTrip>(() => emptyDraft())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDraft(emptyDraft())
      setError(null)
    }
  }, [open])

  const sortedTrips = useMemo(
    () => [...trips].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [trips],
  )

  function handleAdd() {
    if (!draft.startDate || !draft.endDate) {
      setError('Uzupełnij obie daty.')
      return
    }
    if (draft.endDate < draft.startDate) {
      setError('Data końcowa nie może być wcześniejsza niż początkowa.')
      return
    }
    api.addTrip({
      startDate: draft.startDate,
      endDate: draft.endDate,
      destination: draft.destination.trim() || undefined,
    })
    setDraft(emptyDraft())
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Wyjazdy do pracy</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <section className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-3">
            <p className="text-sm font-medium">Nowy wyjazd</p>
            <p className="text-xs text-muted-foreground">
              „Powrót do domu” to dzień, w którym wracasz po pracy — licznik
              pokaże 0, gdy nadejdzie ten dzień.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="trip-start">Wyjazd (pierwszy dzień pracy)</Label>
                <Input
                  id="trip-start"
                  type="date"
                  value={draft.startDate}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, startDate: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="trip-end">Powrót do domu (ostatni dzień)</Label>
                <Input
                  id="trip-end"
                  type="date"
                  value={draft.endDate}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, endDate: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="trip-destination">Miejsce (opcjonalne)</Label>
              <Input
                id="trip-destination"
                placeholder="np. Niemcy — Berlin"
                value={draft.destination}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, destination: event.target.value }))
                }
              />
            </div>
            {error ? (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="button" onClick={handleAdd} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Dodaj wyjazd
            </Button>
          </section>

          <section className="space-y-2">
            <p className="text-sm font-medium">Zapisane wyjazdy</p>
            {sortedTrips.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/60 px-3 py-4 text-center text-xs text-muted-foreground">
                Lista jest pusta — dodaj swój pierwszy wyjazd powyżej.
              </p>
            ) : (
              <ul className="space-y-2" role="list">
                {sortedTrips.map((trip) => (
                  <li
                    key={trip.id}
                    className="rounded-xl border border-border/60 bg-background/60 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="truncate text-sm font-medium">
                          {trip.destination?.trim() || 'Wyjazd'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPlLongDate(trip.startDate)} → {formatPlLongDate(trip.endDate)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Usuń wyjazd"
                        onClick={() => api.removeTrip(trip.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="grid gap-1">
                        <Label htmlFor={`start-${trip.id}`} className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Wyjazd
                        </Label>
                        <Input
                          id={`start-${trip.id}`}
                          type="date"
                          value={trip.startDate}
                          onChange={(event) =>
                            api.updateTrip(trip.id, { startDate: event.target.value })
                          }
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor={`end-${trip.id}`} className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Powrót
                        </Label>
                        <Input
                          id={`end-${trip.id}`}
                          type="date"
                          value={trip.endDate}
                          onChange={(event) =>
                            api.updateTrip(trip.id, { endDate: event.target.value })
                          }
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zamknij
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
