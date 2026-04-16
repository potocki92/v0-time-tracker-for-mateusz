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
import { useEntryForm } from './useEntryForm'
import { useEntryMutations } from './useEntryMutations'

export type { WorkStatus } from './useEntryForm'

const DEFAULT_EUR_TO_PLN = 4.3
const MONTHLY_BASELINE_HOURS = 160

export function useCalendarData() {
  const supabase = createClient()

  // ── Data state ─────────────────────────────────────────────────────────
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ── Navigation state ───────────────────────────────────────────────────
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  // ── Modal state ────────────────────────────────────────────────────────
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const defaultClient = useMemo(
    () => clients.find((c) => c.is_default),
    [clients],
  )

  const monthEntries = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
    return workEntries.filter((entry) => entry.date.startsWith(prefix))
  }, [workEntries, currentYear, currentMonth])

  // ── Form ───────────────────────────────────────────────────────────────
  const form = useEntryForm(clients, projects, defaultClient)

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

  // ── Mutations ──────────────────────────────────────────────────────────
  const getFormSnapshot = useCallback(() => ({
    formStatus: form.formStatus,
    formClientId: form.formClientId,
    formProjectId: form.formProjectId,
    formHours: form.formHours,
    formQuantityFrom: form.formQuantityFrom,
    formQuantityTo: form.formQuantityTo,
    formNotes: form.formNotes,
    selectedClient: form.selectedClient,
  }), [
    form.formStatus, form.formClientId, form.formProjectId,
    form.formHours, form.formQuantityFrom, form.formQuantityTo,
    form.formNotes, form.selectedClient,
  ])

  const mutations = useEntryMutations({
    currentYear,
    currentMonth,
    selectedDay,
    entriesByDate,
    getFormSnapshot,
    populateForm: form.populateForm,
    onSuccess: loadData,
    onClose: () => setIsModalOpen(false),
  })

  // ── Actions ────────────────────────────────────────────────────────────
  function openDayModal(day: number) {
    const dateStr = getDateString(currentYear, currentMonth, day)
    if (isFutureDate(dateStr)) return

    setSelectedDay(day)
    const existing = entriesByDate.get(dateStr)
    existing ? form.populateForm(existing) : form.resetForm()
    setIsModalOpen(true)
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

  // ── Zachowany identyczny interfejs zwracany ────────────────────────────
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
    isSaving: mutations.isSaving,
    // Form
    formStatus: form.formStatus,
    formClientId: form.formClientId,
    formProjectId: form.formProjectId,
    formHours: form.formHours,
    formQuantityFrom: form.formQuantityFrom,
    formQuantityTo: form.formQuantityTo,
    formNotes: form.formNotes,
    // Derived
    daysInMonth,
    firstDayOfMonth,
    entriesByDate,
    selectedClient: form.selectedClient,
    clientProjects: form.clientProjects,
    monthEntries,
    stats,
    constants: {
      defaultHours: form.constants.defaultHours,
      defaultEurToPln: DEFAULT_EUR_TO_PLN,
      formatCurrency,
    },
    actions: {
      setIsModalOpen,
      setFormStatus: form.setFormStatus,
      setFormClientId: form.setFormClientId,
      setFormProjectId: form.setFormProjectId,
      setFormHours: form.setFormHours,
      setFormQuantityFrom: form.setFormQuantityFrom,
      setFormQuantityTo: form.setFormQuantityTo,
      setFormNotes: form.setFormNotes,
      openDayModal,
      saveEntry: mutations.saveEntry,
      deleteEntry: mutations.deleteEntry,
      prevMonth,
      nextMonth,
      clonePreviousDayEntry: mutations.clonePreviousDayEntry,
    },
  }
}
