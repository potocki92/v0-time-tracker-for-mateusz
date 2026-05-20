'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Trash2 } from 'lucide-react'
import type { Client, Project, WorkEntry } from '@/lib/types'
import { MONTH_NAMES } from '@/lib/types'
import type { WorkStatus } from '../../_domain/calendar.types'
import { ClientSelect } from './ClientSelect'
import { HoursInput } from './HoursInput'
import { ProjectSelect } from './ProjectSelect'
import { QuantityInput } from './QuantityInput'
import { StatusSelect } from './StatusSelect'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void

  // Header context
  selectedDay: number | null
  currentMonth: number
  currentYear: number
  existingEntry: WorkEntry | undefined

  // Form state
  status: WorkStatus
  entryKind: 'real' | 'predicted'
  isFutureDate: boolean
  clientId: string
  projectId: string
  hours: number
  quantityFrom: number
  quantityTo: number
  notes: string

  // Collections
  clients: Client[]
  clientProjects: Project[]
  selectedClient: Client | undefined

  // Handlers
  onChangeStatus: (value: WorkStatus) => void
  onChangeEntryKind: (value: 'real' | 'predicted') => void
  onChangeClientId: (value: string) => void
  onChangeProjectId: (value: string) => void
  onChangeHours: (value: number) => void
  onChangeQuantityFrom: (value: number) => void
  onChangeQuantityTo: (value: number) => void
  onChangeNotes: (value: string) => void

  // Actions
  onSave: () => void
  onDelete: () => void
  onClonePrevious: () => void
  isSaving: boolean
}

/**
 * Modal edycji/dodania wpisu. Zachowuje się jak shadcn Dialog na wszystkich
 * rozdzielczościach — na mobile przyklejony do krawędzi ekranu z marginesem,
 * treść zorganizowana w ~5 zwartych sekcji dla łatwej nawigacji kciukiem.
 */
export function DayEntryDialog({
  open,
  onOpenChange,
  selectedDay,
  currentMonth,
  currentYear,
  existingEntry,
  status,
  entryKind,
  isFutureDate,
  clientId,
  projectId,
  hours,
  quantityFrom,
  quantityTo,
  notes,
  clients,
  clientProjects,
  selectedClient,
  onChangeStatus,
  onChangeEntryKind,
  onChangeClientId,
  onChangeProjectId,
  onChangeHours,
  onChangeQuantityFrom,
  onChangeQuantityTo,
  onChangeNotes,
  onSave,
  onDelete,
  onClonePrevious,
  isSaving,
}: Props) {
  const isPredicted = entryKind === 'predicted'
  const isWorked = isPredicted || status === 'worked'
  const saveDisabled = isSaving || (isWorked && !clientId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 max-h-[92vh] sm:max-w-[440px]">
        <DialogHeader className="border-b bg-muted/30 px-4 py-3.5 sm:px-5 sm:py-4">
          <DialogTitle className="text-sm font-semibold sm:text-base">
            {selectedDay && `${selectedDay} ${MONTH_NAMES[currentMonth]} ${currentYear}`}
          </DialogTitle>
          {existingEntry && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">Edycja istniejącego wpisu</p>
          )}
          {entryKind === 'predicted' && (
            <Badge variant="secondary" className="mt-2 w-fit text-[11px]">
              Planujesz przewidywane godziny dla tej daty
            </Badge>
          )}
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tryb wpisu
            </Label>
            {isFutureDate ? (
              <Badge variant="secondary" className="w-fit text-[11px]">
                Przewidywane (dla przyszłych dat)
              </Badge>
            ) : (
              <Tabs
                value={entryKind}
                onValueChange={(v) => onChangeEntryKind(v as 'real' | 'predicted')}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="real">Realne</TabsTrigger>
                  <TabsTrigger value="predicted">Przewidywane</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>

          {!isPredicted && <StatusSelect value={status} onChange={onChangeStatus} />}

          {isWorked && (
            <>
              <Separator className="opacity-50" />

              <ClientSelect
                clients={clients}
                value={clientId}
                onChange={onChangeClientId}
              />

              <ProjectSelect
                projects={clientProjects}
                value={projectId}
                onChange={onChangeProjectId}
              />

              {selectedClient?.work_type === 'hourly' ? (
                <HoursInput value={hours} onChange={onChangeHours} />
              ) : selectedClient?.work_type === 'piecework' ? (
                <QuantityInput
                  unit={selectedClient.unit ?? ''}
                  from={quantityFrom}
                  to={quantityTo}
                  onChangeFrom={onChangeQuantityFrom}
                  onChangeTo={onChangeQuantityTo}
                />
              ) : null}
            </>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Notatki
            </Label>
            <Textarea
              placeholder="Opcjonalne notatki…"
              value={notes}
              onChange={(e) => onChangeNotes(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 border-t bg-muted/20 px-4 py-3 sm:justify-between sm:px-5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClonePrevious}
            className="h-9 gap-1.5 text-xs sm:h-8"
          >
            <Copy className="h-3.5 w-3.5" />
            <span className="hidden xs:inline sm:hidden md:inline">Klonuj poprzedni</span>
            <span className="xs:hidden sm:inline md:hidden">Klonuj</span>
          </Button>

          <div className="flex gap-2">
            {existingEntry && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
                disabled={isSaving}
                className="h-9 gap-1.5 text-xs sm:h-8"
                aria-label="Usuń wpis"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Usuń
              </Button>
            )}
            <Button
              size="sm"
              onClick={onSave}
              disabled={saveDisabled}
              className="h-9 min-w-[88px] text-xs sm:h-8"
            >
              {isSaving ? 'Zapisywanie…' : 'Zapisz'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
