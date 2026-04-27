'use client'

import { useCallback, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutGrid, List } from 'lucide-react'
import { useEffectiveEurRate } from '@/app/(app)/dashboard/_hooks/usePreferencesStore'
import { getDateString, isFutureDate } from '@/lib/helpers'
import {
  useCalendarData,
  useCalendarInsights,
  useCalendarNavigation,
  useCalendarStats,
  useDayDialog,
  useEntryForm,
  useEntryMutations,
  useMonthEntries,
} from '../_hooks'
import { selectDefaultClient } from '../_domain/calendar.selectors'
import type { CalendarView } from '../_domain/calendar.types'
import {
  CalendarGridErrorBoundary,
  CalendarListErrorBoundary,
  CalendarStatsErrorBoundary,
} from './errors'
import { CalendarPageHeader } from './CalendarPageHeader'
import { CalendarStats } from './stats'
import { CalendarGrid, CalendarMonthNav, StatusLegend } from './grid'
import { CalendarList } from './list'
import { MonthInsights } from './insights'
import { DayEntryDialog } from './dialog'
import { MONTH_NAMES, type WorkEntry } from '@/lib/types'

export function CalendarContent() {
  const { data } = useCalendarData()
  const { clients, projects, workEntries } = data

  const eurRate = useEffectiveEurRate()
  const defaultClient = useMemo(() => selectDefaultClient(clients), [clients])

  const nav = useCalendarNavigation()
  const { monthEntries, entriesByDate } = useMonthEntries(
    workEntries,
    nav.currentYear,
    nav.currentMonth,
  )
  const stats = useCalendarStats(monthEntries, clients, eurRate)
  const insights = useCalendarInsights({
    allEntries: workEntries,
    monthEntries,
    clients,
    eurRate,
    year: nav.currentYear,
    month: nav.currentMonth,
    daysInMonth: nav.daysInMonth,
  })

  const form = useEntryForm(clients, projects, defaultClient)
  const [view, setView] = useState<CalendarView>('month')

  const onDialogOpen = useCallback(
    (existing: WorkEntry | undefined) => {
      existing ? form.populateForm(existing) : form.resetForm()
    },
    [form],
  )

  const dialog = useDayDialog({
    currentYear: nav.currentYear,
    currentMonth: nav.currentMonth,
    entriesByDate,
    onOpen: onDialogOpen,
  })

  const mutations = useEntryMutations({ onSuccess: dialog.close })

  const handleSave = () => {
    if (!dialog.selectedDateStr) return
    mutations.saveEntry({
      date: dialog.selectedDateStr,
      form: form.values,
      workType: form.selectedClient?.work_type,
      existingId: dialog.existingEntry?.id,
    })
  }

  const handleDelete = () => {
    if (!dialog.existingEntry) return
    mutations.deleteEntry(dialog.existingEntry.id)
  }

  const handleClonePrevious = () => {
    if (dialog.selectedDay === null) return
    const prev = new Date(nav.currentYear, nav.currentMonth, dialog.selectedDay - 1)
    const key = getDateString(prev.getFullYear(), prev.getMonth(), prev.getDate())
    if (isFutureDate(key)) return
    const prevEntry = entriesByDate.get(key)
    if (prevEntry) form.populateForm(prevEntry)
  }

  const handleSelectEntry = useCallback(
    (entry: WorkEntry) => {
      const day = Number(entry.date.split('-')[2])
      dialog.openDay(day)
    },
    [dialog],
  )

  return (
    <>
      <CalendarPageHeader
        currentMonth={nav.currentMonth}
        currentYear={nav.currentYear}
        workDays={stats.workDays}
        totalEntries={monthEntries.length}
      />

      <div className="container space-y-4 px-4 py-4 sm:space-y-5 sm:py-6">
        <CalendarStatsErrorBoundary>
          <CalendarStats
            {...stats}
            streakCurrent={insights.activeStreak.current}
            streakLongest={insights.activeStreak.longestThisYear}
          />
        </CalendarStatsErrorBoundary>

        <Tabs value={view} onValueChange={(v) => setView(v as CalendarView)} className="space-y-3">
          <div className="flex items-center justify-between">
            <TabsList className="h-8 rounded-lg p-0.5">
              <TabsTrigger value="month" className="h-7 gap-1.5 px-3 text-xs">
                <LayoutGrid className="h-3.5 w-3.5" />
                Miesiąc
              </TabsTrigger>
              <TabsTrigger value="list" className="h-7 gap-1.5 px-3 text-xs">
                <List className="h-3.5 w-3.5" />
                Lista
              </TabsTrigger>
            </TabsList>
            <p className="hidden text-[11px] text-muted-foreground sm:block">
              {stats.workDays} dni pracy • {monthEntries.length} wpisów
            </p>
          </div>

          <TabsContent value="month" className="mt-0 space-y-3">
            <CalendarGridErrorBoundary>
              <Card className="overflow-hidden border-border/60 shadow-sm">
                <CardContent className="space-y-3 p-3 sm:p-4">
                  <CalendarMonthNav
                    currentMonth={nav.currentMonth}
                    currentYear={nav.currentYear}
                    isCurrentMonth={nav.isCurrentMonth}
                    onPrev={nav.prevMonth}
                    onNext={nav.nextMonth}
                    onToday={nav.goToToday}
                  />
                  <CalendarGrid
                    daysInMonth={nav.daysInMonth}
                    firstDayOfMonth={nav.firstDayOfMonth}
                    currentMonth={nav.currentMonth}
                    currentYear={nav.currentYear}
                    entriesByDate={entriesByDate}
                    clients={clients}
                    eurToPln={eurRate}
                    onOpenDay={dialog.openDay}
                  />
                  <StatusLegend />
                </CardContent>
              </Card>
            </CalendarGridErrorBoundary>
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            <CalendarListErrorBoundary>
              <CalendarList
                entries={monthEntries}
                clients={clients}
                onSelectEntry={handleSelectEntry}
              />
            </CalendarListErrorBoundary>
          </TabsContent>
        </Tabs>

        <MonthInsights
          monthName={MONTH_NAMES[nav.currentMonth]}
          insights={insights}
          onViewAllEntries={() => setView('list')}
        />
      </div>

      <DayEntryDialog
        open={dialog.isOpen}
        onOpenChange={dialog.setIsOpen}
        selectedDay={dialog.selectedDay}
        currentMonth={nav.currentMonth}
        currentYear={nav.currentYear}
        existingEntry={dialog.existingEntry}
        status={form.values.status}
        clientId={form.values.clientId}
        projectId={form.values.projectId}
        hours={form.values.hours}
        quantityFrom={form.values.quantityFrom}
        quantityTo={form.values.quantityTo}
        notes={form.values.notes}
        clients={clients}
        clientProjects={form.clientProjects}
        selectedClient={form.selectedClient}
        onChangeStatus={form.setStatus}
        onChangeClientId={form.setClientId}
        onChangeProjectId={form.setProjectId}
        onChangeHours={form.setHours}
        onChangeQuantityFrom={form.setQuantityFrom}
        onChangeQuantityTo={form.setQuantityTo}
        onChangeNotes={form.setNotes}
        onSave={handleSave}
        onDelete={handleDelete}
        onClonePrevious={handleClonePrevious}
        isSaving={mutations.isSaving}
      />
    </>
  )
}
