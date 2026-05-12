'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react'

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
  const [editingTripId, setEditingTripId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDraft(emptyDraft())
      setError(null)
      setEditingTripId(null)
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
              <ul
                role="list"
                className="divide-y divide-border/50 overflow-hidden rounded-xl border border-border/60 bg-background/40"
              >
                {sortedTrips.map((trip) => {
                  const isEditing = editingTripId === trip.id
                  return (
                    <li key={trip.id}>
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => setEditingTripId(isEditing ? null : trip.id)}
                          aria-expanded={isEditing}
                          aria-controls={`trip-edit-${trip.id}`}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <ChevronDown
                            className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${isEditing ? 'rotate-180' : ''}`}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {trip.destination?.trim() || 'Wyjazd'}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {formatPlLongDate(trip.startDate)} → {formatPlLongDate(trip.endDate)}
                            </p>
                          </div>
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={isEditing ? 'Zamknij edycję' : 'Edytuj wyjazd'}
                          onClick={() => setEditingTripId(isEditing ? null : trip.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Usuń wyjazd"
                          onClick={() => api.removeTrip(trip.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {isEditing ? (
                        <div
                          id={`trip-edit-${trip.id}`}
                          className="grid gap-2 border-t border-border/50 bg-muted/20 px-3 py-3 sm:grid-cols-2"
                        >
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
                          <div className="grid gap-1 sm:col-span-2">
                            <Label htmlFor={`destination-${trip.id}`} className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              Miejsce
                            </Label>
                            <Input
                              id={`destination-${trip.id}`}
                              placeholder="np. Niemcy — Berlin"
                              value={trip.destination ?? ''}
                              onChange={(event) =>
                                api.updateTrip(trip.id, {
                                  destination: event.target.value || undefined,
                                })
                              }
                            />
                          </div>
                        </div>
                      ) : null}
                    </li>
                  )
                })}
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
