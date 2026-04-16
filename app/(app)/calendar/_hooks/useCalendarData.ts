'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Client, Project, WorkEntry } from '@/lib/types'
import {
  formatCurrency,
  getDateString,
  getDaysInMonth,
  getFirstDayOfMonth,
  isFutureDate,
} from '@/lib/helpers'
import { calculateEarnings } from '@/lib/finance/earnings'
import { toast } from 'sonner'

export type WorkStatus = 'worked' | 'not_worked' | 'vacation' | 'sick_leave' | 'day_off'

const DEFAULT_HOURS = 8
const DEFAULT_EUR_TO_PLN = 4.3
const MONTHLY_BASELINE_HOURS = 160

// ─── Initial form state ────────────────────────────────────────────────────
const defaultFormState = {
  formStatus: 'worked' as WorkStatus,
  formClientId: '',
  formProjectId: '',
  formHours: DEFAULT_HOURS,
  formQuantityFrom: 0,
  formQuantityTo: 0,
  formNotes: '',
}

export function useCalendarData() {
  const supabase = createClient()

  // ── Data state ─────────────────────────────────────────────────────────
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // ── Navigation state ───────────────────────────────────────────────────
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  // ── Modal state ────────────────────────────────────────────────────────
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // ── Form state ─────────────────────────────────────────────────────────
  const [formStatus, setFormStatus] = useState<WorkStatus>(defaultFormState.formStatus)
  const [formClientId, setFormClientId] = useState(defaultFormState.formClientId)
  const [formProjectId, setFormProjectId] = useState(defaultFormState.formProjectId)
  const [formHours, setFormHours] = useState(defaultFormState.formHours)
  const [formQuantityFrom, setFormQuantityFrom] = useState(defaultFormState.formQuantityFrom)
  const [formQuantityTo, setFormQuantityTo] = useState(defaultFormState.formQuantityTo)
  const [formNotes, setFormNotes] = useState(defaultFormState.formNotes)

  // ── Load data ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [clientsRes, projectsRes, entriesRes] = await Promise.all([
        supabase.from('clients').select('*').eq('user_id', user.id),
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('work_entries').select('*').eq('user_id', user.id),
      ])

      if (clientsRes.data) setClients(clientsRes.data)
      if (projectsRes.data) setProjects(projectsRes.data)
      if (entriesRes.data) setWorkEntries(entriesRes.data)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  // ── Derived calendar values ────────────────────────────────────────────
  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth)

  const entriesByDate = useMemo(() => {
    const map = new Map<string, WorkEntry>()
    workEntries.forEach((entry) => map.set(entry.date, entry))
    return map
  }, [workEntries])

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === formClientId),
    [clients, formClientId],
  )

  const clientProjects = useMemo(
    () => projects.filter((p) => p.client_id === formClientId),
    [projects, formClientId],
  )

  const defaultClient = useMemo(
    () => clients.find((c) => c.is_default),
    [clients],
  )

  const monthEntries = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
    return workEntries.filter((entry) => entry.date.startsWith(prefix))
  }, [workEntries, currentYear, currentMonth])

  // ── Stats ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const workedEntries = monthEntries.filter((e) => e.status === 'worked')
    const workDays = workedEntries.length
    const freeDays = monthEntries.filter((e) => e.status !== 'worked').length
    const totalHours = workedEntries.reduce((acc, e) => acc + (e.hours ?? 0), 0)
    const earningsPLN = workedEntries.reduce((acc, entry) => {
      const client = entry.client_id ? clients.find((c) => c.id === entry.client_id) : undefined
      return acc + calculateEarnings(entry, client, DEFAULT_EUR_TO_PLN).amountInPLN
    }, 0)

    return {
      totalHours,
      forecastPLN: earningsPLN,
      workDays,
      freeDays,
      progressPercent: Math.min(100, (totalHours / MONTHLY_BASELINE_HOURS) * 100),
      baselineHours: MONTHLY_BASELINE_HOURS,
    }
  }, [monthEntries, clients])

  // ── Form helpers ───────────────────────────────────────────────────────
  function populateForm(entry: WorkEntry) {
    setFormStatus(entry.status as WorkStatus)
    setFormClientId(entry.client_id || '')
    setFormProjectId(entry.project_id || '')
    setFormHours(entry.hours || DEFAULT_HOURS)
    setFormQuantityFrom(entry.quantity_from || 0)
    setFormQuantityTo(entry.quantity_to || 0)
    setFormNotes(entry.notes || '')
  }

  function resetForm() {
    setFormStatus('worked')
    setFormClientId(defaultClient?.id || '')
    setFormProjectId('')
    setFormHours(DEFAULT_HOURS)
    setFormQuantityFrom(0)
    setFormQuantityTo(0)
    setFormNotes('')
  }

  // ── Actions ────────────────────────────────────────────────────────────
  function openDayModal(day: number) {
    const dateStr = getDateString(currentYear, currentMonth, day)
    if (isFutureDate(dateStr)) return

    setSelectedDay(day)
    const existing = entriesByDate.get(dateStr)
    existing ? populateForm(existing) : resetForm()
    setIsModalOpen(true)
  }

  async function saveEntry() {
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

      const existing = entriesByDate.get(dateStr)
      const payload = {
        user_id: user.id,
        date: dateStr,
        status: formStatus,
        client_id: formStatus === 'worked' ? formClientId || null : null,
        project_id: formStatus === 'worked' && formProjectId !== 'none' ? formProjectId || null : null,
        hours: formStatus === 'worked' && selectedClient?.work_type === 'hourly' ? formHours : null,
        quantity:
          formStatus === 'worked' && selectedClient?.work_type === 'piecework'
            ? formQuantityTo - formQuantityFrom
            : null,
        quantity_from:
          formStatus === 'worked' && selectedClient?.work_type === 'piecework' ? formQuantityFrom : null,
        quantity_to:
          formStatus === 'worked' && selectedClient?.work_type === 'piecework' ? formQuantityTo : null,
        notes: formNotes || null,
      }

      const result = existing
        ? await supabase.from('work_entries').update(payload).eq('id', existing.id)
        : await supabase.from('work_entries').insert(payload)

      if (result.error) {
        toast.error('Błąd podczas zapisywania')
      } else {
        toast.success(existing ? 'Zaktualizowano wpis' : 'Dodano wpis')
        await loadData()
        setIsModalOpen(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteEntry() {
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
        await loadData()
        setIsModalOpen(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  function clonePreviousDayEntry() {
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
  }

  function prevMonth() {
    setCurrentMonth((m) => {
      if (m === 0) { setCurrentYear((y) => y - 1); return 11 }
      return m - 1
    })
  }

  function nextMonth() {
    setCurrentMonth((m) => {
      if (m === 11) { setCurrentYear((y) => y + 1); return 0 }
      return m + 1
    })
  }

  return {
    // Data
    clients,
    projects,
    workEntries,
    // Navigation
    currentMonth,
    currentYear,
    // Modal
    selectedDay,
    isModalOpen,
    // Loading
    isLoading,
    isSaving,
    // Form
    formStatus,
    formClientId,
    formProjectId,
    formHours,
    formQuantityFrom,
    formQuantityTo,
    formNotes,
    // Derived
    daysInMonth,
    firstDayOfMonth,
    entriesByDate,
    selectedClient,
    clientProjects,
    monthEntries,
    stats,
    constants: {
      defaultHours: DEFAULT_HOURS,
      defaultEurToPln: DEFAULT_EUR_TO_PLN,
      formatCurrency,
    },
    actions: {
      setIsModalOpen,
      setFormStatus,
      setFormClientId,
      setFormProjectId,
      setFormHours,
      setFormQuantityFrom,
      setFormQuantityTo,
      setFormNotes,
      openDayModal,
      saveEntry,
      deleteEntry,
      prevMonth,
      nextMonth,
      clonePreviousDayEntry,
    },
  }
}