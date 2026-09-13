'use client'

import { useEffect, useMemo, useState } from 'react'
import { useFormat } from '@/lib/format/client'
import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SURFACE } from '@/components/ui/tokens'
import {
  WORKSPACE_FIELD,
  WORKSPACE_FIELD_LABEL,
  WorkspaceOverlay,
  WorkspaceOverlayBody,
  WorkspaceOverlayFooter,
} from '@/components/workspace'
import { cn } from '@/lib/utils'

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
  const fmt = useFormat()
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
    <WorkspaceOverlay
      open={open}
      onOpenChange={onOpenChange}
      title="Wyjazdy do pracy"
      size="md"
    >
      <WorkspaceOverlayBody className="overflow-x-hidden">
        <div className="min-w-0 space-y-5">
          <section className={cn(SURFACE.cardNested, 'space-y-3 p-3')}>
            <p className="text-sm font-medium text-white">Nowy wyjazd</p>
            <p className="text-xs text-zinc-400">
              „Powrót do domu” to dzień, w którym wracasz po pracy — licznik
              pokaże 0, gdy nadejdzie ten dzień.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="trip-start" className={WORKSPACE_FIELD_LABEL}>Wyjazd (pierwszy dzień pracy)</Label>
                <Input
                  id="trip-start"
                  type="date"
                  value={draft.startDate}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, startDate: event.target.value }))
                  }
                  className={WORKSPACE_FIELD}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="trip-end" className={WORKSPACE_FIELD_LABEL}>Powrót do domu (ostatni dzień)</Label>
                <Input
                  id="trip-end"
                  type="date"
                  value={draft.endDate}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, endDate: event.target.value }))
                  }
                  className={WORKSPACE_FIELD}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="trip-destination" className={WORKSPACE_FIELD_LABEL}>Miejsce (opcjonalne)</Label>
              <Input
                id="trip-destination"
                placeholder="np. Niemcy — Berlin"
                value={draft.destination}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, destination: event.target.value }))
                }
                className={WORKSPACE_FIELD}
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

          <section className="min-w-0 space-y-2">
            <p className="text-sm font-medium">Zapisane wyjazdy</p>
            {sortedTrips.length === 0 ? (
              <p className="rounded-xl border border-dashed border-hairline px-3 py-4 text-center text-xs text-zinc-400">
                Lista jest pusta — dodaj swój pierwszy wyjazd powyżej.
              </p>
            ) : (
              <ul
                role="list"
                className={cn(SURFACE.cardNested, 'divide-y divide-hairline-strong overflow-hidden')}
              >
                {sortedTrips.map((trip) => {
                  const isEditing = editingTripId === trip.id
                  return (
                    <li key={trip.id} className="min-w-0">
                      <div className="flex min-w-0 items-center gap-1 px-2 py-2 sm:gap-2 sm:px-3">
                        <button
                          type="button"
                          onClick={() => setEditingTripId(isEditing ? null : trip.id)}
                          aria-expanded={isEditing}
                          aria-controls={`trip-edit-${trip.id}`}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <ChevronDown
                            className={`h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform ${isEditing ? 'rotate-180' : ''}`}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {trip.destination?.trim() || 'Wyjazd'}
                            </p>
                            <p className="truncate text-2xs text-zinc-400">
                              {formatPlLongDate(fmt, trip.startDate)} → {formatPlLongDate(fmt, trip.endDate)}
                            </p>
                          </div>
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={isEditing ? 'Zamknij edycję' : 'Edytuj wyjazd'}
                          onClick={() => setEditingTripId(isEditing ? null : trip.id)}
                          className="size-8 shrink-0 text-zinc-400 hover:text-white"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Usuń wyjazd"
                          onClick={() => api.removeTrip(trip.id)}
                          className="size-8 shrink-0 text-zinc-400 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {isEditing ? (
                        <div
                          id={`trip-edit-${trip.id}`}
                          className="grid gap-2 border-t border-hairline-strong bg-surface-2 px-3 py-3 sm:grid-cols-2"
                        >
                          <div className="grid gap-1">
                            <Label htmlFor={`start-${trip.id}`} className="text-2xs uppercase tracking-wide text-zinc-400">
                              Wyjazd
                            </Label>
                            <Input
                              id={`start-${trip.id}`}
                              type="date"
                              value={trip.startDate}
                              onChange={(event) =>
                                api.updateTrip(trip.id, { startDate: event.target.value })
                              }
                              className={WORKSPACE_FIELD}
                            />
                          </div>
                          <div className="grid gap-1">
                            <Label htmlFor={`end-${trip.id}`} className="text-2xs uppercase tracking-wide text-zinc-400">
                              Powrót
                            </Label>
                            <Input
                              id={`end-${trip.id}`}
                              type="date"
                              value={trip.endDate}
                              onChange={(event) =>
                                api.updateTrip(trip.id, { endDate: event.target.value })
                              }
                              className={WORKSPACE_FIELD}
                            />
                          </div>
                          <div className="grid gap-1 sm:col-span-2">
                            <Label htmlFor={`destination-${trip.id}`} className="text-2xs uppercase tracking-wide text-zinc-400">
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
                              className={WORKSPACE_FIELD}
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
      </WorkspaceOverlayBody>

      <WorkspaceOverlayFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 sm:h-9">
          Zamknij
        </Button>
      </WorkspaceOverlayFooter>
    </WorkspaceOverlay>
  )
}
