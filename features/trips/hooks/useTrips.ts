'use client'

import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { MUTATION_KEYS, QUERY_CONFIG, QUERY_KEYS } from '@/lib/query'

import type { Trip } from '../domain'
import {
  deleteTripAction,
  fetchTripsAction,
  insertTripAction,
  updateTripAction,
} from '../actions'

export interface UseTripsResult {
  trips: Trip[]
  /** `true`, gdy serwer odpowiedział i mamy aktualną listę z bazy. */
  isHydrated: boolean
  addTrip: (input: Omit<Trip, 'id'>) => void
  updateTrip: (id: string, patch: Partial<Omit<Trip, 'id'>>) => void
  removeTrip: (id: string) => void
}

/**
 * CRUD na wyjazdach trzymanych w Supabase (tabela `public.trips`, RLS na user_id).
 * Cache jest globalny po stronie TanStack Query — kalendarz i dashboard widzą
 * tę samą listę i każda mutacja invaliduje key `trips`.
 */
export function useTrips(): UseTripsResult {
  const queryClient = useQueryClient()

  const { data, isSuccess } = useQuery<Trip[]>({
    queryKey: QUERY_KEYS.trips(),
    queryFn: fetchTripsAction,
    ...QUERY_CONFIG.trips,
  })

  const trips = useMemo(
    () => [...(data ?? [])].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [data],
  )

  // Wyjazd zmienia obraz kalendarza i pulpitu (dni wolne, przepracowany czas) —
  // wczesniej robil to `revalidatePath('/calendar')` / `revalidatePath('/dashboard')`.
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips() })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.calendar() })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard() })
  }, [queryClient])

  const addMutation = useMutation({
    mutationKey: MUTATION_KEYS.trip.create,
    mutationFn: insertTripAction,
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationKey: MUTATION_KEYS.trip.update,
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<Trip, 'id'>> }) =>
      updateTripAction(id, patch),
    onSuccess: invalidate,
  })

  const removeMutation = useMutation({
    mutationKey: MUTATION_KEYS.trip.delete,
    mutationFn: deleteTripAction,
    onSuccess: invalidate,
  })

  const addTrip = useCallback(
    (input: Omit<Trip, 'id'>) => addMutation.mutate(input),
    [addMutation],
  )
  const updateTrip = useCallback(
    (id: string, patch: Partial<Omit<Trip, 'id'>>) =>
      updateMutation.mutate({ id, patch }),
    [updateMutation],
  )
  const removeTrip = useCallback(
    (id: string) => removeMutation.mutate(id),
    [removeMutation],
  )

  return { trips, isHydrated: isSuccess, addTrip, updateTrip, removeTrip }
}
