'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Client, Project, WorkEntry } from '@/lib/types'
import { calculateEarnings, formatCurrency, getDateString, getDaysInMonth, getFirstDayOfMonth, isFutureDate } from '@/lib/helpers'
import { toast } from 'sonner'

export type WorkStatus = 'worked' | 'not_worked' | 'vacation' | 'sick_leave' | 'day_off'

const DEFAULT_HOURS = 8
const DEFAULT_EUR_TO_PLN = 4.3
const MONTHLY_BASELINE_HOURS = 160

export function useCalendarData() {
  const supabase = createClient()

  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [formStatus, setFormStatus] = useState<WorkStatus>('worked')
  const [formClientId, setFormClientId] = useState<string>('')
  const [formProjectId, setFormProjectId] = useState<string>('')
  const [formHours, setFormHours] = useState<number>(DEFAULT_HOURS)
  const [formQuantityFrom, setFormQuantityFrom] = useState<number>(0)
  const [formQuantityTo, setFormQuantityTo] = useState<number>(0)
  const [formNotes, setFormNotes] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsLoading(false)
      return
    }

    const [clientsRes, projectsRes, entriesRes] = await Promise.all([
      supabase.from('clients').select('*').eq('user_id', user.id),
      supabase.from('projects').select('*').eq('user_id', user.id),
      supabase.from('work_entries').select('*').eq('user_id', user.id),
    ])

    if (clientsRes.data) setClients(clientsRes.data)
    if (projectsRes.data) setProjects(projectsRes.data)
    if (entriesRes.data) setWorkEntries(entriesRes.data)

    setIsLoading(false)
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth)

  const entriesByDate = useMemo(() => {
    const map = new Map<string, WorkEntry>()
    workEntries.forEach((entry) => map.set(entry.date, entry))
    return map
  }, [workEntries])

  const selectedClient = useMemo(() => clients.find((c) => c.id === formClientId), [clients, formClientId])
  const clientProjects = useMemo(() => projects.filter((p) => p.client_id === formClientId), [projects, formClientId])
  const defaultClient = useMemo(() => clients.find((c) => c.is_default), [clients])

  const monthEntries = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
    return workEntries.filter((entry) => entry.date.startsWith(monthPrefix))
  }, [workEntries, currentYear, currentMonth])

  const stats = useMemo(() => {
    const workedEntries = monthEntries.filter((entry) => entry.status === 'worked')
    const workDays = workedEntries.length
    const freeDays = monthEntries.filter((entry) => entry.status !== 'worked').length
    const totalHours = workedEntries.reduce((acc, entry) => acc + (entry.hours ?? 0), 0)
    const earningsPLN = workedEntries.reduce((acc, entry) => {
      const client = entry.client_id ? clients.find((c) => c.id === entry.client_id) : undefined
      const earnings = calculateEarnings(entry, client, DEFAULT_EUR_TO_PLN)
      return acc + earnings.amountInPLN
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

  function openDayModal(day: number) {
    const dateStr = getDateString(currentYear, currentMonth, day)
    if (isFutureDate(dateStr)) return

    setSelectedDay(day)
    const existingEntry = entriesByDate.get(dateStr)

    if (existingEntry) {
      setFormStatus(existingEntry.status as WorkStatus)
      setFormClientId(existingEntry.client_id || '')
      setFormProjectId(existingEntry.project_id || '')
      setFormHours(existingEntry.hours || DEFAULT_HOURS)
      setFormQuantityFrom(existingEntry.quantity_from || 0)
      setFormQuantityTo(existingEntry.quantity_to || 0)
      setFormNotes(existingEntry.notes || '')
    } else {
      setFormStatus('worked')
      setFormClientId(defaultClient?.id || '')
      setFormProjectId('')
      setFormHours(DEFAULT_HOURS)
      setFormQuantityFrom(0)
      setFormQuantityTo(0)
      setFormNotes('')
    }

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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsSaving(false)
      return
    }

    const existingEntry = entriesByDate.get(dateStr)

    const entryData = {
      user_id: user.id,
      date: dateStr,
      status: formStatus,
      client_id: formStatus === 'worked' ? formClientId || null : null,
      project_id: formStatus === 'worked' && formProjectId !== 'none' ? formProjectId || null : null,
      hours: formStatus === 'worked' && selectedClient?.work_type === 'hourly' ? formHours : null,
      quantity: formStatus === 'worked' && selectedClient?.work_type === 'piecework' ? (formQuantityTo - formQuantityFrom) : null,
      quantity_from: formStatus === 'worked' && selectedClient?.work_type === 'piecework' ? formQuantityFrom : null,
      quantity_to: formStatus === 'worked' && selectedClient?.work_type === 'piecework' ? formQuantityTo : null,
      notes: formNotes || null,
    }

    const result = existingEntry
      ? await supabase.from('work_entries').update(entryData).eq('id', existingEntry.id)
      : await supabase.from('work_entries').insert(entryData)

    if (result.error) {
      toast.error('Błąd podczas zapisywania')
    } else {
      toast.success('Zapisano')
      await loadData()
    }

    setIsSaving(false)
    setIsModalOpen(false)
  }

  async function clonePreviousDayEntry() {
    if (!selectedDay) return
    const currentDate = getDateString(currentYear, currentMonth, selectedDay)
    if (isFutureDate(currentDate)) return

    const prevDate = new Date(currentYear, currentMonth, selectedDay)
    prevDate.setDate(prevDate.getDate() - 1)
    const prevDateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`
    const previousEntry = entriesByDate.get(prevDateStr)

    if (!previousEntry) {
      toast.error('Brak wpisu w poprzednim dniu')
      return
    }

    setFormStatus(previousEntry.status as WorkStatus)
    setFormClientId(previousEntry.client_id || '')
    setFormProjectId(previousEntry.project_id || '')
    setFormHours(previousEntry.hours || DEFAULT_HOURS)
    setFormQuantityFrom(previousEntry.quantity_from || 0)
    setFormQuantityTo(previousEntry.quantity_to || 0)
    setFormNotes(previousEntry.notes || '')
    toast.success('Skopiowano poprzedni dzień')
  }

  async function deleteEntry() {
    if (!selectedDay) return
    const dateStr = getDateString(currentYear, currentMonth, selectedDay)
    const existingEntry = entriesByDate.get(dateStr)
    if (!existingEntry) return

    setIsSaving(true)
    const { error } = await supabase.from('work_entries').delete().eq('id', existingEntry.id)

    if (error) {
      toast.error('Błąd podczas usuwania')
    } else {
      toast.success('Usunięto')
      await loadData()
    }

    setIsSaving(false)
    setIsModalOpen(false)
  }

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((prev) => prev - 1)
    } else {
      setCurrentMonth((prev) => prev - 1)
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((prev) => prev + 1)
    } else {
      setCurrentMonth((prev) => prev + 1)
    }
  }

  return {
    clients,
    projects,
    currentMonth,
    currentYear,
    selectedDay,
    isModalOpen,
    isLoading,
    isSaving,
    formStatus,
    formClientId,
    formProjectId,
    formHours,
    formQuantityFrom,
    formQuantityTo,
    formNotes,
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
