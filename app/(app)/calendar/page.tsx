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
import { getDateString } from '@/lib/helpers'
import { MONTH_NAMES, STATUS_LABELS } from '@/lib/types'
import { CalendarGrid } from './_components/CalendarGrid'
import { CalendarHeader } from './_components/CalendarHeader'
import { CalendarStats } from './_components/CalendarStats'
import { useCalendarData } from './_hooks/useCalendarData'

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

  return (
    <div className="container space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Kalendarz</h1>
      </div>

      <CalendarStats {...stats} />

      <Tabs defaultValue="month" className="space-y-4">
        <TabsList>
          <TabsTrigger value="month">Miesiąc</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="space-y-4">
          <CalendarHeader
            currentMonth={currentMonth}
            currentYear={currentYear}
            onPrevMonth={actions.prevMonth}
            onNextMonth={actions.nextMonth}
          />

          <Card>
            <CardContent className="pt-4">
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

        <TabsContent value="list">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Klient</TableHead>
                    <TableHead>Godziny / Ilość</TableHead>
                    <TableHead>Notatka</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Brak wpisów w tym miesiącu.
                      </TableCell>
                    </TableRow>
                  ) : (
                    listEntries.map((entry) => {
                      const client = entry.client_id ? clients.find((c) => c.id === entry.client_id) : undefined
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>{entry.date}</TableCell>
                          <TableCell>{STATUS_LABELS[entry.status]}</TableCell>
                          <TableCell>{client?.name || '-'}</TableCell>
                          <TableCell>
                            {entry.status === 'worked'
                              ? client?.work_type === 'hourly'
                                ? `${entry.hours ?? 0}h`
                                : `${entry.quantity ?? 0} ${client?.unit ?? ''}`
                              : '-'}
                          </TableCell>
                          <TableCell className="max-w-[260px] truncate">{entry.notes || '-'}</TableCell>
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

      <Dialog open={isModalOpen} onOpenChange={actions.setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedDay && `${selectedDay} ${MONTH_NAMES[currentMonth]} ${currentYear}`}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formStatus} onValueChange={(v) => actions.setFormStatus(v as typeof formStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="worked">Pracowałem</SelectItem>
                  <SelectItem value="not_worked">Nie pracowałem</SelectItem>
                  <SelectItem value="vacation">Urlop</SelectItem>
                  <SelectItem value="sick_leave">L4</SelectItem>
                  <SelectItem value="day_off">Dzień wolny</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formStatus === 'worked' && (
              <>
                <div className="space-y-2">
                  <Label>Klient</Label>
                  <Select value={formClientId} onValueChange={actions.setFormClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz klienta" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.rate} {client.currency}/{client.work_type === 'hourly' ? 'h' : client.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {clientProjects.length > 0 && (
                  <div className="space-y-2">
                    <Label>Projekt</Label>
                    <Select value={formProjectId} onValueChange={actions.setFormProjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz projekt (opcjonalnie)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Brak projektu</SelectItem>
                        {clientProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedClient?.work_type === 'hourly' ? (
                  <div className="space-y-2">
                    <Label>Godziny</Label>
                    <Input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={formHours}
                      onChange={(e) => actions.setFormHours(Number(e.target.value))}
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
                        onChange={(e) => actions.setFormQuantityFrom(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Do ({selectedClient.unit})</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.1}
                        value={formQuantityTo}
                        onChange={(e) => actions.setFormQuantityTo(Number(e.target.value))}
                      />
                    </div>
                    {formQuantityTo > formQuantityFrom && (
                      <div className="col-span-2 text-sm text-muted-foreground">
                        Różnica: {(formQuantityTo - formQuantityFrom).toFixed(2)} {selectedClient.unit}
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            )}

            <div className="space-y-2">
              <Label>Notatki</Label>
              <Textarea
                placeholder="Opcjonalne notatki..."
                value={formNotes}
                onChange={(e) => actions.setFormNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button type="button" variant="secondary" onClick={actions.clonePreviousDayEntry} className="w-full sm:w-auto">
              Klonuj poprzedni dzień
            </Button>
            {entriesByDate.get(getDateString(currentYear, currentMonth, selectedDay || 1)) && (
              <Button variant="destructive" onClick={actions.deleteEntry} disabled={isSaving} className="w-full sm:w-auto">
                Usuń
              </Button>
            )}
            <Button
              onClick={actions.saveEntry}
              disabled={isSaving || (formStatus === 'worked' && !formClientId)}
              className="w-full sm:w-auto"
            >
              {isSaving ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
