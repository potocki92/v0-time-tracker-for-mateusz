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
import { selectDefaultClient, selectTripDayMarkers } from '../_domain/calendar.selectors'
import { useTrips } from '@/features/trips'
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
import { AppFooter } from '@/components/common/AppFooter'
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
  const { trips } = useTrips()
  const tripDayMarkers = useMemo(
    () =>
      selectTripDayMarkers(
        trips,
        nav.currentYear,
        nav.currentMonth,
        nav.daysInMonth,
        nav.firstDayOfMonth,
      ),
    [trips, nav.currentYear, nav.currentMonth, nav.daysInMonth, nav.firstDayOfMonth],
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
  const [selectedEntryId, setSelectedEntryId] = useState<string | undefined>(undefined)

  const onDialogOpen = useCallback(
    (dateStr: string) => {
      const isFutureSelection = isFutureDate(dateStr)
      const dayEntries = entriesByDate.get(dateStr) ?? []
      const preferredKind: 'real' | 'predicted' = isFutureSelection ? 'predicted' : 'real'
      const existing = dayEntries.find((entry) => (entry.entry_kind ?? 'real') === preferredKind)

      setSelectedEntryId(existing?.id)
      if (existing) form.populateForm(existing)
      else form.resetForm(preferredKind)
    },
    [entriesByDate, form],
  )

  const dialog = useDayDialog({
    currentYear: nav.currentYear,
    currentMonth: nav.currentMonth,
    onOpen: onDialogOpen,
  })

  const selectedDateEntries = useMemo(
    () => (dialog.selectedDateStr ? entriesByDate.get(dialog.selectedDateStr) ?? [] : []),
    [dialog.selectedDateStr, entriesByDate],
  )
  const existingEntry = useMemo(
    () => selectedDateEntries.find((entry) => entry.id === selectedEntryId),
    [selectedDateEntries, selectedEntryId],
  )

  const mutations = useEntryMutations({ onSuccess: dialog.close })

  const handleSave = () => {
    if (!dialog.selectedDateStr) return
    mutations.saveEntry({
      date: dialog.selectedDateStr,
      form: form.values,
      workType: form.selectedClient?.work_type,
      existingId: existingEntry?.id,
    })
  }

  const handleDelete = () => {
    if (!existingEntry) return
    mutations.deleteEntry(existingEntry.id)
  }

  const handleClonePrevious = () => {
    if (dialog.selectedDay === null) return
    const prev = new Date(nav.currentYear, nav.currentMonth, dialog.selectedDay - 1)
    const key = getDateString(prev.getFullYear(), prev.getMonth(), prev.getDate())
    const prevEntry = entriesByDate
      .get(key)
      ?.find((entry) => (entry.entry_kind ?? 'real') === form.values.entryKind)
    if (prevEntry) {
      form.populateForm(prevEntry)
      setSelectedEntryId(undefined)
    }
  }

  const handleSelectEntry = useCallback(
    (entry: WorkEntry) => {
      const day = Number(entry.date.split('-')[2])
      dialog.openDay(day)
    },
    [dialog],
  )

  const handleChangeEntryKind = useCallback(
    (nextKind: 'real' | 'predicted') => {
      form.setEntryKind(nextKind)
      const match = selectedDateEntries.find((entry) => (entry.entry_kind ?? 'real') === nextKind)
      if (match) {
        setSelectedEntryId(match.id)
        form.populateForm(match)
        return
      }
      setSelectedEntryId(undefined)
      form.resetForm(nextKind)
    },
    [form, selectedDateEntries],
  )

  return (
    <>
      <CalendarPageHeader
        currentMonth={nav.currentMonth}
        currentYear={nav.currentYear}
        workDays={stats.workDays}
        totalEntries={monthEntries.length}
      />

      <div className="mx-auto w-full max-w-2xl space-y-5 px-3 pb-28 pt-2 sm:px-4 md:max-w-5xl md:px-6 md:pb-10 md:pt-3 lg:px-8">
        <CalendarStatsErrorBoundary>
          <CalendarStats
            {...stats}
            streakCurrent={insights.activeStreak.current}
            streakLongest={insights.activeStreak.longestThisYear}
          />
        </CalendarStatsErrorBoundary>

        <Tabs
          value={view}
          onValueChange={(v) => setView(v as CalendarView)}
          className="space-y-3"
        >
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

              {/* Segmentowany przełącznik widoku — wewnątrz karty, wycentrowany,
                  spójny ze wzorcem "Today / Month / Week / List" z designu. */}
              <div className="flex justify-center">
                <TabsList
                  aria-label="Widok kalendarza"
                  className="h-9 rounded-full border border-border/60 bg-muted/40 p-0.5 shadow-inner"
                >
                  <TabsTrigger
                    value="month"
                    className="h-8 gap-1.5 rounded-full px-4 text-xs data-[state=active]:shadow-sm"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Miesiąc
                  </TabsTrigger>
                  <TabsTrigger
                    value="list"
                    className="h-8 gap-1.5 rounded-full px-4 text-xs data-[state=active]:shadow-sm"
                  >
                    <List className="h-3.5 w-3.5" />
                    Lista
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="month" className="mt-0 space-y-3">
                <CalendarGridErrorBoundary>
                  <CalendarGrid
                    daysInMonth={nav.daysInMonth}
                    firstDayOfMonth={nav.firstDayOfMonth}
                    currentMonth={nav.currentMonth}
                    currentYear={nav.currentYear}
                    entriesByDate={entriesByDate}
                    tripDayMarkers={tripDayMarkers}
                    clients={clients}
                    eurToPln={eurRate}
                    onOpenDay={dialog.openDay}
                  />
                  <StatusLegend />
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
            </CardContent>
          </Card>
        </Tabs>

        <MonthInsights
          monthName={MONTH_NAMES[nav.currentMonth]}
          insights={insights}
          onViewAllEntries={() => setView('list')}
        />

        <AppFooter />
      </div>

      <DayEntryDialog
        open={dialog.isOpen}
        onOpenChange={dialog.setIsOpen}
        selectedDay={dialog.selectedDay}
        currentMonth={nav.currentMonth}
        currentYear={nav.currentYear}
        existingEntry={existingEntry}
        status={form.values.status}
        entryKind={form.values.entryKind}
        isFutureDate={Boolean(dialog.selectedDateStr && isFutureDate(dialog.selectedDateStr))}
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
        onChangeEntryKind={handleChangeEntryKind}
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
