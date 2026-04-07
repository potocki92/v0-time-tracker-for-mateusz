'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  ChevronLeft, 
  ChevronRight,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'
import type { Client, WorkEntry, Project, Profile } from '@/lib/types'
import { MONTH_NAMES, DAY_NAMES, STATUS_COLORS, STATUS_LABELS } from '@/lib/types'
import { getDaysInMonth, getFirstDayOfMonth, getDateString, isFutureDate, calculateEarnings, formatCurrency } from '@/lib/helpers'

type WorkStatus = 'worked' | 'not_worked' | 'vacation' | 'sick_leave' | 'day_off'

export default function CalendarPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formStatus, setFormStatus] = useState<WorkStatus>('worked')
  const [formClientId, setFormClientId] = useState<string>('')
  const [formProjectId, setFormProjectId] = useState<string>('')
  const [formHours, setFormHours] = useState<number>(8)
  const [formQuantity, setFormQuantity] = useState<number>(0)
  const [formQuantityFrom, setFormQuantityFrom] = useState<number>(0)
  const [formQuantityTo, setFormQuantityTo] = useState<number>(0)
  const [formNotes, setFormNotes] = useState<string>('')

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, clientsRes, projectsRes, entriesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('clients').select('*').eq('user_id', user.id),
      supabase.from('projects').select('*').eq('user_id', user.id),
      supabase.from('work_entries').select('*').eq('user_id', user.id),
    ])

    if (profileRes.data) setProfile(profileRes.data)
    if (clientsRes.data) setClients(clientsRes.data)
    if (projectsRes.data) setProjects(projectsRes.data)
    if (entriesRes.data) setWorkEntries(entriesRes.data)
    
    setIsLoading(false)
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth)

  const entriesByDate = useMemo(() => {
    const map = new Map<string, WorkEntry>()
    workEntries.forEach(entry => {
      map.set(entry.date, entry)
    })
    return map
  }, [workEntries])

  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === formClientId)
  }, [clients, formClientId])

  const clientProjects = useMemo(() => {
    return projects.filter(p => p.client_id === formClientId)
  }, [projects, formClientId])

  const defaultClient = useMemo(() => {
    return clients.find(c => c.is_default)
  }, [clients])

  function openDayModal(day: number) {
    const dateStr = getDateString(currentYear, currentMonth, day)
    if (isFutureDate(dateStr)) return

    setSelectedDay(day)
    const existingEntry = entriesByDate.get(dateStr)

    if (existingEntry) {
      setFormStatus(existingEntry.status as WorkStatus)
      setFormClientId(existingEntry.client_id || '')
      setFormProjectId(existingEntry.project_id || '')
      setFormHours(existingEntry.hours || profile?.default_hours || 8)
      setFormQuantity(existingEntry.quantity || 0)
      setFormQuantityFrom(existingEntry.quantity_from || 0)
      setFormQuantityTo(existingEntry.quantity_to || 0)
      setFormNotes(existingEntry.notes || '')
    } else {
      setFormStatus('worked')
      setFormClientId(defaultClient?.id || '')
      setFormProjectId('')
      setFormHours(profile?.default_hours || 8)
      setFormQuantity(0)
      setFormQuantityFrom(0)
      setFormQuantityTo(0)
      setFormNotes('')
    }

    setIsModalOpen(true)
  }

  async function saveEntry() {
    if (!selectedDay) return
    setIsSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const dateStr = getDateString(currentYear, currentMonth, selectedDay)
    const existingEntry = entriesByDate.get(dateStr)

    const entryData = {
      user_id: user.id,
      date: dateStr,
      status: formStatus,
      client_id: formStatus === 'worked' ? formClientId || null : null,
      project_id: formStatus === 'worked' ? formProjectId || null : null,
      hours: formStatus === 'worked' && selectedClient?.work_type === 'hourly' ? formHours : null,
      quantity: formStatus === 'worked' && selectedClient?.work_type === 'piecework' 
        ? (formQuantityTo - formQuantityFrom) 
        : null,
      quantity_from: formStatus === 'worked' && selectedClient?.work_type === 'piecework' ? formQuantityFrom : null,
      quantity_to: formStatus === 'worked' && selectedClient?.work_type === 'piecework' ? formQuantityTo : null,
      notes: formNotes || null,
    }

    let error
    if (existingEntry) {
      const res = await supabase
        .from('work_entries')
        .update(entryData)
        .eq('id', existingEntry.id)
      error = res.error
    } else {
      const res = await supabase
        .from('work_entries')
        .insert(entryData)
      error = res.error
    }

    if (error) {
      toast.error('Blad podczas zapisywania')
    } else {
      toast.success('Zapisano')
      await loadData()
    }

    setIsSaving(false)
    setIsModalOpen(false)
  }

  async function deleteEntry() {
    if (!selectedDay) return
    const dateStr = getDateString(currentYear, currentMonth, selectedDay)
    const existingEntry = entriesByDate.get(dateStr)
    if (!existingEntry) return

    setIsSaving(true)
    const { error } = await supabase
      .from('work_entries')
      .delete()
      .eq('id', existingEntry.id)

    if (error) {
      toast.error('Blad podczas usuwania')
    } else {
      toast.success('Usunieto')
      await loadData()
    }

    setIsSaving(false)
    setIsModalOpen(false)
  }

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Ladowanie...</div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Kalendarz</h1>
      </div>

      {/* Month Navigation */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-lg">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_NAMES.map((day, i) => (
              <div 
                key={day} 
                className={`text-center text-xs font-medium py-2 ${
                  i >= 5 ? 'text-muted-foreground' : ''
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before first day of month */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16 sm:h-20" />
            ))}
            
            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = getDateString(currentYear, currentMonth, day)
              const entry = entriesByDate.get(dateStr)
              const isFuture = isFutureDate(dateStr)
              const isToday = dateStr === getDateString(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

              const client = entry?.client_id ? clients.find(c => c.id === entry.client_id) : undefined
              const earnings = entry && client ? calculateEarnings(entry, client, profile?.eur_to_pln || 4.30) : null

              return (
                <button
                  key={day}
                  onClick={() => !isFuture && openDayModal(day)}
                  disabled={isFuture}
                  className={`
                    h-16 sm:h-20 p-1 rounded-lg border text-left transition-all
                    flex flex-col overflow-hidden
                    ${isFuture ? 'bg-muted/30 cursor-not-allowed opacity-50' : 'hover:border-primary/50 cursor-pointer'}
                    ${isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                    ${entry ? STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS].replace('bg-', 'bg-opacity-20 bg-') : 'bg-card'}
                  `}
                >
                  <span className={`text-xs font-medium ${isToday ? 'text-primary' : ''}`}>
                    {day}
                  </span>
                  {entry && entry.status === 'worked' && (
                    <div className="mt-auto text-[10px] leading-tight">
                      {client?.work_type === 'hourly' ? (
                        <span className="font-medium">{entry.hours}h</span>
                      ) : (
                        <span className="font-medium">{entry.quantity} {client?.unit}</span>
                      )}
                      {earnings && earnings.amount > 0 && (
                        <div className="text-muted-foreground truncate">
                          {formatCurrency(earnings.amount, earnings.currency)}
                        </div>
                      )}
                    </div>
                  )}
                  {entry && entry.status !== 'worked' && (
                    <div className={`mt-auto text-[10px] font-medium ${
                      entry.status === 'vacation' ? 'text-blue-600' :
                      entry.status === 'sick_leave' ? 'text-amber-600' :
                      entry.status === 'day_off' ? 'text-gray-600' :
                      'text-red-600'
                    }`}>
                      {STATUS_LABELS[entry.status as keyof typeof STATUS_LABELS]}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDay && `${selectedDay} ${MONTH_NAMES[currentMonth]} ${currentYear}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formStatus} onValueChange={(v) => setFormStatus(v as WorkStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="worked">Pracowalem</SelectItem>
                  <SelectItem value="not_worked">Nie pracowalem</SelectItem>
                  <SelectItem value="vacation">Urlop</SelectItem>
                  <SelectItem value="sick_leave">L4</SelectItem>
                  <SelectItem value="day_off">Dzien wolny</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formStatus === 'worked' && (
              <>
                {/* Client */}
                <div className="space-y-2">
                  <Label>Klient</Label>
                  <Select value={formClientId} onValueChange={setFormClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz klienta" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.rate} {client.currency}/{client.work_type === 'hourly' ? 'h' : client.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Project */}
                {clientProjects.length > 0 && (
                  <div className="space-y-2">
                    <Label>Projekt</Label>
                    <Select value={formProjectId} onValueChange={setFormProjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz projekt (opcjonalnie)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Brak projektu</SelectItem>
                        {clientProjects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Hours or Quantity */}
                {selectedClient?.work_type === 'hourly' ? (
                  <div className="space-y-2">
                    <Label>Godziny</Label>
                    <Input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={formHours}
                      onChange={(e) => setFormHours(Number(e.target.value))}
                    />
                  </div>
                ) : selectedClient?.work_type === 'piecework' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Od ({selectedClient.unit})</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.1}
                        value={formQuantityFrom}
                        onChange={(e) => setFormQuantityFrom(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Do ({selectedClient.unit})</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.1}
                        value={formQuantityTo}
                        onChange={(e) => setFormQuantityTo(Number(e.target.value))}
                      />
                    </div>
                    {formQuantityTo > formQuantityFrom && (
                      <div className="col-span-2 text-sm text-muted-foreground">
                        Roznica: {(formQuantityTo - formQuantityFrom).toFixed(2)} {selectedClient.unit} = {formatCurrency((formQuantityTo - formQuantityFrom) * selectedClient.rate, selectedClient.currency)}
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notatki</Label>
              <Textarea
                placeholder="Opcjonalne notatki..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {entriesByDate.get(getDateString(currentYear, currentMonth, selectedDay || 1)) && (
              <Button
                variant="destructive"
                onClick={deleteEntry}
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                Usun
              </Button>
            )}
            <Button
              onClick={saveEntry}
              disabled={isSaving || (formStatus === 'worked' && !formClientId)}
              className="w-full sm:w-auto"
            >
              {isSaving ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Legend */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 text-xs">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${STATUS_COLORS[key as keyof typeof STATUS_COLORS]}`} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
