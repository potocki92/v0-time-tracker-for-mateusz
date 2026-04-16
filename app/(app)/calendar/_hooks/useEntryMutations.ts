import { useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WorkEntry } from '@/lib/types'
import type { WorkStatus } from './useEntryForm'
import { getDateString, isFutureDate } from '@/lib/helpers'
import { toast } from 'sonner'

interface EntryFormSnapshot {
  formStatus: WorkStatus
  formClientId: string
  formProjectId: string
  formHours: number
  formQuantityFrom: number
  formQuantityTo: number
  formNotes: string
  selectedClient: { work_type: string } | undefined
}

interface MutationDeps {
  currentYear: number
  currentMonth: number
  selectedDay: number | null
  entriesByDate: Map<string, WorkEntry>
  getFormSnapshot: () => EntryFormSnapshot
  populateForm: (entry: WorkEntry) => void
  onSuccess: () => Promise<void>
  onClose: () => void
}

export function useEntryMutations(deps: MutationDeps) {
  const supabase = createClient()
  const [isSaving, setIsSaving] = useState(false)

  const saveEntry = useCallback(async () => {
    const { selectedDay, currentYear, currentMonth, entriesByDate, getFormSnapshot, onSuccess, onClose } = deps
    if (!selectedDay) return

    const dateStr = getDateString(currentYear, currentMonth, selectedDay)
    if (isFutureDate(dateStr)) {
      toast.error('Nie można zapisywać wpisów w przyszłości')
      return
    }

    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const form = getFormSnapshot()
      const existing = entriesByDate.get(dateStr)
      const payload = {
        user_id: user.id,
        date: dateStr,
        status: form.formStatus,
        client_id: form.formStatus === 'worked' ? form.formClientId || null : null,
        project_id: form.formStatus === 'worked' && form.formProjectId !== 'none' ? form.formProjectId || null : null,
        hours: form.formStatus === 'worked' && form.selectedClient?.work_type === 'hourly' ? form.formHours : null,
        quantity:
          form.formStatus === 'worked' && form.selectedClient?.work_type === 'piecework'
            ? form.formQuantityTo - form.formQuantityFrom
            : null,
        quantity_from:
          form.formStatus === 'worked' && form.selectedClient?.work_type === 'piecework' ? form.formQuantityFrom : null,
        quantity_to:
          form.formStatus === 'worked' && form.selectedClient?.work_type === 'piecework' ? form.formQuantityTo : null,
        notes: form.formNotes || null,
      }

      const result = existing
        ? await supabase.from('work_entries').update(payload).eq('id', existing.id)
        : await supabase.from('work_entries').insert(payload)

      if (result.error) {
        toast.error('Błąd podczas zapisywania')
      } else {
        toast.success(existing ? 'Zaktualizowano wpis' : 'Dodano wpis')
        await onSuccess()
        onClose()
      }
    } finally {
      setIsSaving(false)
    }
  }, [supabase, deps])

  const deleteEntry = useCallback(async () => {
    const { selectedDay, currentYear, currentMonth, entriesByDate, onSuccess, onClose } = deps
    if (!selectedDay) return

    const dateStr = getDateString(currentYear, currentMonth, selectedDay)
    const existing = entriesByDate.get(dateStr)
    if (!existing) return

    setIsSaving(true)
    try {
      const { error } = await supabase.from('work_entries').delete().eq('id', existing.id)
      if (error) {
        toast.error('Błąd podczas usuwania')
      } else {
        toast.success('Usunięto wpis')
        await onSuccess()
        onClose()
      }
    } finally {
      setIsSaving(false)
    }
  }, [supabase, deps])

  const clonePreviousDayEntry = useCallback(() => {
    const { selectedDay, currentYear, currentMonth, entriesByDate, populateForm } = deps
    if (!selectedDay) return

    const currentDate = getDateString(currentYear, currentMonth, selectedDay)
    if (isFutureDate(currentDate)) return

    const prevDate = new Date(currentYear, currentMonth, selectedDay - 1)
    const prevDateStr = getDateString(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate())
    const prev = entriesByDate.get(prevDateStr)

    if (!prev) {
      toast.error('Brak wpisu w poprzednim dniu')
      return
    }

    populateForm(prev)
    toast.success('Skopiowano z poprzedniego dnia')
  }, [deps])

  return { isSaving, saveEntry, deleteEntry, clonePreviousDayEntry }
}
