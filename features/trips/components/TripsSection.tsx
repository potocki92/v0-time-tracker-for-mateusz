'use client'

import { useMemo, useState } from 'react'

import { computeTripCountdown } from '../domain'
import { useTrips } from '../hooks'

import { TripCountdownCard } from './TripCountdownCard'
import { TripManagerDialog } from './TripManagerDialog'

/**
 * Sekcja kalendarza wyjazdów na dashboardzie. Łączy localStorage-backed CRUD,
 * pure logikę liczenia odstępu czasowego i kafelek prezentacji.
 */
export function TripsSection() {
  const { trips, addTrip, updateTrip, removeTrip } = useTrips()
  const [managerOpen, setManagerOpen] = useState(false)

  const state = useMemo(() => computeTripCountdown(trips), [trips])

  return (
    <>
      <TripCountdownCard state={state} onManage={() => setManagerOpen(true)} />
      <TripManagerDialog
        open={managerOpen}
        onOpenChange={setManagerOpen}
        trips={trips}
        api={{ addTrip, updateTrip, removeTrip }}
      />
    </>
  )
}
