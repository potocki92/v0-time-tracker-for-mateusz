import { createClient } from '@/lib/supabase/client'

import type { Trip } from '../domain'

interface TripRow {
  id: string
  user_id: string
  start_date: string
  end_date: string
  destination: string | null
}

function rowToTrip(row: TripRow): Trip {
  return {
    id: row.id,
    startDate: row.start_date,
    endDate: row.end_date,
    destination: row.destination ?? undefined,
  }
}

export async function fetchTrips(): Promise<Trip[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('trips')
    .select('id, user_id, start_date, end_date, destination')
    .order('start_date', { ascending: true })

  if (error) throw new Error(`fetchTrips: ${error.message}`)
  return ((data ?? []) as TripRow[]).map(rowToTrip)
}

export async function insertTrip(input: Omit<Trip, 'id'>): Promise<Trip> {
  const supabase = createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('insertTrip: brak zalogowanego użytkownika')
  }

  const { data, error } = await supabase
    .from('trips')
    .insert({
      user_id: userData.user.id,
      start_date: input.startDate,
      end_date: input.endDate,
      destination: input.destination ?? null,
    })
    .select('id, user_id, start_date, end_date, destination')
    .single()

  if (error) throw new Error(`insertTrip: ${error.message}`)
  return rowToTrip(data as TripRow)
}

export async function updateTripRecord(
  id: string,
  patch: Partial<Omit<Trip, 'id'>>,
): Promise<Trip> {
  const supabase = createClient()
  const dbPatch: Record<string, unknown> = {}
  if (patch.startDate !== undefined) dbPatch.start_date = patch.startDate
  if (patch.endDate !== undefined) dbPatch.end_date = patch.endDate
  if ('destination' in patch) dbPatch.destination = patch.destination ?? null

  const { data, error } = await supabase
    .from('trips')
    .update(dbPatch)
    .eq('id', id)
    .select('id, user_id, start_date, end_date, destination')
    .single()

  if (error) throw new Error(`updateTripRecord: ${error.message}`)
  return rowToTrip(data as TripRow)
}

export async function deleteTripRecord(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('trips').delete().eq('id', id)
  if (error) throw new Error(`deleteTripRecord: ${error.message}`)
}
