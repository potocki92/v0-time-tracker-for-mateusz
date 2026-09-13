'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  WORKSPACE_FIELD_LABEL,
  WORKSPACE_FIELD_MULTILINE,
  WorkspaceOverlay,
  WorkspaceOverlayBody,
  WorkspaceOverlayFooter,
  WorkspaceSegmentedControl,
} from '@/components/workspace'
import { Copy, Trash2 } from 'lucide-react'
import type { Client, Project, WorkEntry } from '@/lib/types'
import { useFormat } from '@/lib/format/client'
import { cn } from '@/lib/utils'
import { getDateString } from '@/lib/helpers'
import type { WorkStatus } from '../../domain/calendar.types'
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
  const fmt = useFormat()
  const isPredicted = entryKind === 'predicted'
  const isWorked = isPredicted || status === 'worked'
  const saveDisabled = isSaving || (isWorked && !clientId)

  const dayLabel =
    selectedDay === null
      ? ''
      : fmt.date(getDateString(currentYear, currentMonth, selectedDay), 'long')

  return (
    <WorkspaceOverlay
      open={open}
      onOpenChange={onOpenChange}
      title={dayLabel}
      description={existingEntry ? 'Edycja istniejącego wpisu' : undefined}
      size="md"
    >
      <WorkspaceOverlayBody className="space-y-4">
        {entryKind === 'predicted' && (
          <Badge variant="secondary" className="w-fit text-2xs">
            Planujesz przewidywane godziny dla tej daty
          </Badge>
        )}

        <div className="space-y-1.5">
          <Label className={WORKSPACE_FIELD_LABEL}>Tryb wpisu</Label>
          {isFutureDate ? (
            <Badge variant="secondary" className="w-fit text-2xs">
              Przewidywane (dla przyszłych dat)
            </Badge>
          ) : (
            <WorkspaceSegmentedControl
              ariaLabel="Tryb wpisu"
              value={entryKind}
              options={[
                { value: 'real' as const, label: 'Realne' },
                { value: 'predicted' as const, label: 'Przewidywane' },
              ]}
              onChange={onChangeEntryKind}
              className="flex w-full [&>button]:flex-1"
            />
          )}
        </div>

        {!isPredicted && <StatusSelect value={status} onChange={onChangeStatus} />}

        {isWorked && (
          <>
            <Separator className="opacity-50" />

            <ClientSelect clients={clients} value={clientId} onChange={onChangeClientId} />

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
          <Label className={WORKSPACE_FIELD_LABEL}>Notatki</Label>
          <Textarea
            placeholder="Opcjonalne notatki…"
            value={notes}
            onChange={(e) => onChangeNotes(e.target.value)}
            rows={2}
            className={cn(WORKSPACE_FIELD_MULTILINE, 'resize-none')}
          />
        </div>
      </WorkspaceOverlayBody>

      {/* Trzy akcje o różnym ciężarze, więc stopka łamie domyślny układ:
          „klonuj" zostaje przy lewej krawędzi, zapis i usunięcie po prawej. */}
      <WorkspaceOverlayFooter className="flex-row items-center justify-between sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClonePrevious}
          className="h-9 gap-1.5 text-xs"
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
              className="h-9 gap-1.5 text-xs"
              aria-label="Usuń wpis"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Usuń
            </Button>
          )}
          <Button
            variant="accent"
            size="sm"
            onClick={onSave}
            disabled={saveDisabled}
            className="h-9 min-w-[88px] text-xs"
          >
            {isSaving ? 'Zapisywanie…' : 'Zapisz'}
          </Button>
        </div>
      </WorkspaceOverlayFooter>
    </WorkspaceOverlay>
  )
}
