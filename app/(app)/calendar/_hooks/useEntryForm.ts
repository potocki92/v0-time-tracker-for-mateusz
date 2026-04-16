import { useState, useMemo, useCallback } from 'react'
import type { Client, Project, WorkEntry } from '@/lib/types'

export type WorkStatus = 'worked' | 'not_worked' | 'vacation' | 'sick_leave' | 'day_off'

const DEFAULT_HOURS = 8

export function useEntryForm(clients: Client[], projects: Project[], defaultClient: Client | undefined) {
  const [formStatus, setFormStatus] = useState<WorkStatus>('worked')
  const [formClientId, setFormClientId] = useState('')
  const [formProjectId, setFormProjectId] = useState('')
  const [formHours, setFormHours] = useState(DEFAULT_HOURS)
  const [formQuantityFrom, setFormQuantityFrom] = useState(0)
  const [formQuantityTo, setFormQuantityTo] = useState(0)
  const [formNotes, setFormNotes] = useState('')

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === formClientId),
    [clients, formClientId],
  )

  const clientProjects = useMemo(
    () => projects.filter((p) => p.client_id === formClientId),
    [projects, formClientId],
  )

  const populateForm = useCallback((entry: WorkEntry) => {
    setFormStatus(entry.status as WorkStatus)
    setFormClientId(entry.client_id || '')
    setFormProjectId(entry.project_id || '')
    setFormHours(entry.hours || DEFAULT_HOURS)
    setFormQuantityFrom(entry.quantity_from || 0)
    setFormQuantityTo(entry.quantity_to || 0)
    setFormNotes(entry.notes || '')
  }, [])

  const resetForm = useCallback(() => {
    setFormStatus('worked')
    setFormClientId(defaultClient?.id || '')
    setFormProjectId('')
    setFormHours(DEFAULT_HOURS)
    setFormQuantityFrom(0)
    setFormQuantityTo(0)
    setFormNotes('')
  }, [defaultClient?.id])

  return {
    formStatus,
    formClientId,
    formProjectId,
    formHours,
    formQuantityFrom,
    formQuantityTo,
    formNotes,
    selectedClient,
    clientProjects,
    setFormStatus,
    setFormClientId,
    setFormProjectId,
    setFormHours,
    setFormQuantityFrom,
    setFormQuantityTo,
    setFormNotes,
    populateForm,
    resetForm,
    constants: { defaultHours: DEFAULT_HOURS },
  }
}
