'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireServerUser } from '@/lib/auth/server-user'
import { createClient } from '@/lib/supabase/server'
import type { Trip } from './domain'

/**
 * Server Actions modulu Trips.
 *
 * `user_id` bierze sie z sesji serwerowej; Supabase jedzie na anon key
 * + ciasteczkach, wiec RLS (`auth.uid() = user_id`) nadal obowiazuje.
 */

const TRIP_COLUMNS = 'id, user_id, start_date, end_date, destination'

interface TripRow {
  id: string
  user_id: string
  start_date: string
  end_date: string
  destination: string | null
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Nieprawidłowa data')

const tripInputSchema = z.object({
  startDate:   isoDate,
  endDate:     isoDate,
  destination: z.string().trim().max(120).optional(),
})

const tripPatchSchema = tripInputSchema.partial()

const uuidSchema = z.string().uuid('Nieprawidłowy wyjazd')

function firstIssue(error: z.ZodError, fallback: string): string {
  return error.issues[0]?.message ?? fallback
}

function rowToTrip(row: TripRow): Trip {
  return {
    id: row.id,
    startDate: row.start_date,
    endDate: row.end_date,
    destination: row.destination ?? undefined,
  }
}

function revalidateTrips() {
  revalidatePath('/calendar')
  revalidatePath('/dashboard')
}

export async function fetchTripsAction(): Promise<Trip[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trips')
    .select(TRIP_COLUMNS)
    .order('start_date', { ascending: true })

  if (error) throw new Error(`fetchTrips: ${error.message}`)
  return ((data ?? []) as unknown as TripRow[]).map(rowToTrip)
}

export async function insertTripAction(input: Omit<Trip, 'id'>): Promise<Trip> {
  const parsed = tripInputSchema.safeParse(input)
  if (!parsed.success) throw new Error(firstIssue(parsed.error, 'Nieprawidłowe dane wyjazdu'))

  const user = await requireServerUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trips')
    .insert({
      user_id: user.id,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      destination: parsed.data.destination ?? null,
    })
    .select(TRIP_COLUMNS)
    .single()

  if (error) throw new Error(`insertTrip: ${error.message}`)

  revalidateTrips()
  return rowToTrip(data as unknown as TripRow)
}

export async function updateTripAction(
  id: string,
  patch: Partial<Omit<Trip, 'id'>>,
): Promise<Trip> {
  const parsedId = uuidSchema.safeParse(id)
  if (!parsedId.success) throw new Error(firstIssue(parsedId.error, 'Nieprawidłowy wyjazd'))

  const parsed = tripPatchSchema.safeParse(patch)
  if (!parsed.success) throw new Error(firstIssue(parsed.error, 'Nieprawidłowe dane wyjazdu'))

  const supabase = await createClient()
  const dbPatch: Record<string, unknown> = {}
  if (parsed.data.startDate !== undefined) dbPatch.start_date = parsed.data.startDate
  if (parsed.data.endDate !== undefined) dbPatch.end_date = parsed.data.endDate
  if ('destination' in patch) dbPatch.destination = parsed.data.destination ?? null

  const { data, error } = await supabase
    .from('trips')
    .update(dbPatch)
    .eq('id', parsedId.data)
    .select(TRIP_COLUMNS)
    .single()

  if (error) throw new Error(`updateTripRecord: ${error.message}`)

  revalidateTrips()
  return rowToTrip(data as unknown as TripRow)
}

export async function deleteTripAction(id: string): Promise<void> {
  const parsedId = uuidSchema.safeParse(id)
  if (!parsedId.success) throw new Error(firstIssue(parsedId.error, 'Nieprawidłowy wyjazd'))

  const supabase = await createClient()
  const { error } = await supabase.from('trips').delete().eq('id', parsedId.data)

  if (error) throw new Error(`deleteTripRecord: ${error.message}`)

  revalidateTrips()
}
