'use client'

import { useCallback, useMemo, useState } from 'react'
import type { Client, Project, WorkEntry } from '@/lib/types'
import { DEFAULT_ENTRY_HOURS } from '../_domain/calendar.constants'
import { selectClientProjects } from '../_domain/calendar.selectors'
import type { WorkStatus } from '../_domain/calendar.types'

/**
 * Lokalny state formularza modala dodawania/edycji wpisu.
 * Reset / populate decoupled, żeby komponenty mogły deklaratywnie ustawiać wartości.
 */
export function useEntryForm(
  clients: Client[],
  projects: Project[],
  defaultClient: Client | undefined,
) {
  const [entryKind, setEntryKind] = useState<'real' | 'predicted'>('real')
  const [status, setStatus] = useState<WorkStatus>('worked')
  const [clientId, setClientId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [hours, setHours] = useState(DEFAULT_ENTRY_HOURS)
  const [quantityFrom, setQuantityFrom] = useState(0)
  const [quantityTo, setQuantityTo] = useState(0)
  const [notes, setNotes] = useState('')

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId),
    [clients, clientId],
  )

  const clientProjects = useMemo(
    () => selectClientProjects(projects, clientId),
    [projects, clientId],
  )

  const populateForm = useCallback((entry: WorkEntry) => {
    setEntryKind(entry.entry_kind ?? 'real')
    setStatus(entry.status as WorkStatus)
    setClientId(entry.client_id ?? '')
    setProjectId(entry.project_id ?? '')
    setHours(entry.hours ?? DEFAULT_ENTRY_HOURS)
    setQuantityFrom(entry.quantity_from ?? 0)
    setQuantityTo(entry.quantity_to ?? 0)
    setNotes(entry.notes ?? '')
  }, [])

  const resetForm = useCallback((nextEntryKind: 'real' | 'predicted' = 'real') => {
    setEntryKind(nextEntryKind)
    setStatus('worked')
    setClientId(defaultClient?.id ?? '')
    setProjectId('')
    setHours(DEFAULT_ENTRY_HOURS)
    setQuantityFrom(0)
    setQuantityTo(0)
    setNotes('')
  }, [defaultClient?.id])

  return {
    values: { entryKind, status, clientId, projectId, hours, quantityFrom, quantityTo, notes },
    selectedClient,
    clientProjects,
    setStatus,
    setEntryKind,
    setClientId,
    setProjectId,
    setHours,
    setQuantityFrom,
    setQuantityTo,
    setNotes,
    populateForm,
    resetForm,
  }
}
