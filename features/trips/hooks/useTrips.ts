'use client'

import { useCallback, useMemo } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { Trip } from '../domain'

const STORAGE_KEY = 'mateusz:trips:v1'

function isTripArray(value: unknown): value is Trip[] {
  if (!Array.isArray(value)) return false
  return value.every(
    (entry) =>
      entry &&
      typeof entry === 'object' &&
      typeof (entry as Trip).id === 'string' &&
      typeof (entry as Trip).startDate === 'string' &&
      typeof (entry as Trip).endDate === 'string',
  )
}

function generateId(): string {
  if (typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID()
  }
  return `trip_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
}

export interface UseTripsResult {
  trips: Trip[]
  isHydrated: boolean
  addTrip: (input: Omit<Trip, 'id'>) => void
  updateTrip: (id: string, patch: Partial<Omit<Trip, 'id'>>) => void
  removeTrip: (id: string) => void
}

/**
 * Trwałe (localStorage) CRUD na wyjazdach. Świadomie nie idzie do bazy —
 * dla jednego użytkownika to nadmiarowa złożoność, a localStorage daje
 * natychmiastową synchronizację UI bez round-tripów do Supabase.
 */
export function useTrips(): UseTripsResult {
  const [trips, setTrips, { isHydrated }] = useLocalStorage<Trip[]>(
    STORAGE_KEY,
    [],
    { validate: isTripArray },
  )

  const sorted = useMemo(
    () => [...trips].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [trips],
  )

  const addTrip = useCallback(
    (input: Omit<Trip, 'id'>) => {
      setTrips((prev) => [...prev, { ...input, id: generateId() }])
    },
    [setTrips],
  )

  const updateTrip = useCallback(
    (id: string, patch: Partial<Omit<Trip, 'id'>>) => {
      setTrips((prev) => prev.map((trip) => (trip.id === id ? { ...trip, ...patch } : trip)))
    },
    [setTrips],
  )

  const removeTrip = useCallback(
    (id: string) => {
      setTrips((prev) => prev.filter((trip) => trip.id !== id))
    },
    [setTrips],
  )

  return { trips: sorted, isHydrated, addTrip, updateTrip, removeTrip }
}
