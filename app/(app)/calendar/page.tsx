'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getDateString } from '@/lib/helpers'
import { MONTH_NAMES, STATUS_LABELS } from '@/lib/types'
import { CalendarGrid } from './_components/CalendarGrid'
import { CalendarHeader } from './_components/CalendarHeader'
import { CalendarStats } from './_components/CalendarStats'
import { useCalendarData } from './_hooks/useCalendarData'
import { LayoutGrid, List, Briefcase, Clock, Banknote } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
  worked:     { label: 'Pracowałem',    color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
  not_worked: { label: 'Nie pracowałem',color: 'bg-destructive/10 text-destructive border-destructive/30' },
  vacation:   { label: 'Urlop',         color: 'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30' },
  sick_leave: { label: 'L4',            color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  day_off:    { label: 'Dzień wolny',   color: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30' },
} as const

export default function CalendarPage() {
  const {
    clients,
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
    constants,
    actions,
  } = useCalendarData()

  const listEntries = useMemo(
    () => [...monthEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [monthEntries],
  )

  const selectedDateStr = selectedDay ? getDateString(currentYear, currentMonth, selectedDay) : null
  const existingEntry = selectedDateStr ? entriesByDate.get(selectedDateStr) : undefined

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="container flex h-14 items-center gap-3 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
              <LayoutGrid className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-sm font-semibold tracking-tight">Kalendarz Pracy</h1>
          </div>
          <Separator orientation="vertical" className="h-5" />
          <span className="text-xs text-muted-foreground">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
        </div>
      </div>

      <div className="container space-y-5 px-4 py-6">
        <CalendarStats {...stats} />

        <Tabs defaultValue="month" className="space-y-4">
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
            <p className="text-xs text-muted-foreground hidden sm:block">
              {monthEntries.filter(e => e.status === 'worked').length} dni pracy • {listEntries.length} wpisów
            </p>
          </div>

          <TabsContent value="month" className="mt-0 space-y-3">
            <CalendarHeader
              currentMonth={currentMonth}
              currentYear={currentYear}
              onPrevMonth={actions.prevMonth}
              onNextMonth={actions.nextMonth}
            />
            <Card className="overflow-hidden border-border/60 shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <CalendarGrid
                  daysInMonth={daysInMonth}
                  firstDayOfMonth={firstDayOfMonth}
                  currentMonth={currentMonth}
                  currentYear={currentYear}
                  entriesByDate={entriesByDate}
                  clients={clients}
                  eurToPln={constants.defaultEurToPln}
                  onOpenDay={actions.openDayModal}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/60 hover:bg-transparent">
                      <TableHead className="h-10 pl-4 text-xs font-medium">Data</TableHead>
                      <TableHead className="h-10 text-xs font-medium">Status</TableHead>
                      <TableHead className="h-10 text-xs font-medium">Klient</TableHead>
                      <TableHead className="h-10 text-xs font-medium">Godziny / Ilość</TableHead>
                      <TableHead className="h-10 pr-4 text-xs font-medium">Notatka</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <List className="h-8 w-8 opacity-20" />
                            Brak wpisów w tym miesiącu
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      listEntries.map((entry) => {
                        const client = entry.client_id ? clients.find((c) => c.id === entry.client_id) : undefined
                        const cfg = STATUS_CONFIG[entry.status as keyof typeof STATUS_CONFIG]
                        return (
                          <TableRow key={entry.id} className="border-b border-border/40 transition-colors hover:bg-muted/30">
                            <TableCell className="pl-4 text-xs font-mono font-medium">{entry.date}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn('text-[10px] font-medium px-1.5 py-0', cfg?.color)}>
                                {cfg?.label ?? entry.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {client ? (
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                                    style={{ background: stringToColor(client.name) }}
                                  >
                                    {client.name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <span className="text-xs">{client.name}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-medium">
                              {entry.status === 'worked'
                                ? client?.work_type === 'hourly'
                                  ? <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-muted-foreground" />{entry.hours ?? 0}h</span>
                                  : `${entry.quantity ?? 0} ${client?.unit ?? ''}`
                                : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="max-w-[240px] truncate pr-4 text-xs text-muted-foreground">
                              {entry.notes || '—'}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Day modal */}
      <Dialog open={isModalOpen} onOpenChange={actions.setIsModalOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[420px]">
          {/* Modal header with date */}
          <DialogHeader className="border-b bg-muted/30 px-5 py-4">
            <DialogTitle className="text-base font-semibold">
              {selectedDay && `${selectedDay} ${MONTH_NAMES[currentMonth]} ${currentYear}`}
            </DialogTitle>
            {existingEntry && (
              <p className="text-xs text-muted-foreground mt-0.5">Edycja istniejącego wpisu</p>
            )}
          </DialogHeader>

          <div className="space-y-4 px-5 py-4">
            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</Label>
              <Select value={formStatus} onValueChange={(v) => actions.setFormStatus(v as typeof formStatus)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2 text-sm">
                        <span className={cn('inline-block h-2 w-2 rounded-full', statusDot(key))} />
                        {cfg.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formStatus === 'worked' && (
              <>
                <Separator className="opacity-50" />

                {/* Client */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Klient</Label>
                  <Select value={formClientId} onValueChange={actions.setFormClientId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Wybierz klienta…" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                              style={{ background: stringToColor(client.name) }}
                            >
                              {client.name.slice(0, 2).toUpperCase()}
                            </span>
                            <span>{client.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {client.rate} {client.currency}/{client.work_type === 'hourly' ? 'h' : client.unit}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Project */}
                {clientProjects.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Projekt</Label>
                    <Select value={formProjectId} onValueChange={actions.setFormProjectId}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Wybierz projekt (opcjonalnie)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">Brak projektu</span>
                        </SelectItem>
                        {clientProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <span className="flex items-center gap-1.5">
                              <Briefcase className="h-3 w-3 text-muted-foreground" />
                              {project.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Hours / Quantity */}
                {selectedClient?.work_type === 'hourly' ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Godziny</Label>
                    <div className="relative">
                      <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min={0}
                        max={24}
                        step={0.5}
                        value={formHours}
                        onChange={(e) => actions.setFormHours(Number(e.target.value))}
                        className="h-9 pl-8"
                      />
                    </div>
                  </div>
                ) : selectedClient?.work_type === 'piecework' ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Ilość ({selectedClient.unit})
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="mb-1 text-[11px] text-muted-foreground">Od</p>
                        <Input
                          type="number"
                          min={0}
                          step={0.1}
                          value={formQuantityFrom}
                          onChange={(e) => actions.setFormQuantityFrom(Number(e.target.value))}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] text-muted-foreground">Do</p>
                        <Input
                          type="number"
                          min={0}
                          step={0.1}
                          value={formQuantityTo}
                          onChange={(e) => actions.setFormQuantityTo(Number(e.target.value))}
                          className="h-9"
                        />
                      </div>
                    </div>
                    {formQuantityTo > formQuantityFrom && (
                      <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                        Różnica: <span className="font-semibold text-foreground">{(formQuantityTo - formQuantityFrom).toFixed(2)} {selectedClient.unit}</span>
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notatki</Label>
              <Textarea
                placeholder="Opcjonalne notatki…"
                value={formNotes}
                onChange={(e) => actions.setFormNotes(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          </div>

          <DialogFooter className="border-t bg-muted/20 px-5 py-3 flex-row gap-2 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={actions.clonePreviousDayEntry}
              className="h-8 text-xs"
            >
              Klonuj poprzedni dzień
            </Button>
            <div className="flex gap-2">
              {existingEntry && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={actions.deleteEntry}
                  disabled={isSaving}
                  className="h-8 text-xs"
                >
                  Usuń
                </Button>
              )}
              <Button
                size="sm"
                onClick={actions.saveEntry}
                disabled={isSaving || (formStatus === 'worked' && !formClientId)}
                className="h-8 min-w-[80px] text-xs"
              >
                {isSaving ? 'Zapisywanie…' : 'Zapisz'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Utility: deterministic color from string
function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 55%, 48%)`
}

function statusDot(key: string): string {
  const map: Record<string, string> = {
    worked: 'bg-emerald-500',
    not_worked: 'bg-destructive',
    vacation: 'bg-violet-500',
    sick_leave: 'bg-amber-500',
    day_off: 'bg-slate-400',
  }
  return map[key] ?? 'bg-muted'
}