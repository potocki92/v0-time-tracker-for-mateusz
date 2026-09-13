'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { LAYER } from '@/components/ui/tokens'
import {
  WORKSPACE_FIELD,
  WORKSPACE_FIELD_LABEL,
  WORKSPACE_FIELD_MULTILINE,
  WorkspaceOverlay,
  WorkspaceOverlayBody,
  WorkspaceOverlayFooter,
  WorkspaceOverlayForm,
} from '@/components/workspace'
import {
  PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  type Client,
  type Project,
  type ProjectFormData,
} from '@/lib/types'
import {
  PROJECT_BUDGET_LABELS,
  PROJECT_BUDGET_OPTIONS,
  PROJECT_COLOR_OPTIONS,
  PROJECT_PRIORITY_OPTIONS,
  PROJECT_STATUS_OPTIONS,
} from '../../types/projects.constants'

type Props = {
  open: boolean
  isSaving: boolean
  editing: Project | null
  clients: Client[]
  formData: ProjectFormData
  onOpenChange: (open: boolean) => void
  onChange: (value: ProjectFormData) => void
  onSubmit: () => void
}

const TITLE_DESCRIPTION = 'Uzupełnij podstawowe dane, budżet oraz terminy realizacji.'

/**
 * Formularz projektu.
 *
 * Otwiera się NAD panelem szczegółów projektu (overlay w overlayu), stąd
 * `layer="stacked"`; listy selectów portalują się do `<body>` z bazowym z-50,
 * więc bez `LAYER.stackedPopover` chowałyby się pod tym overlayem. Cała
 * drabinka warstw stoi w `components/ui/tokens.ts`.
 *
 * Wcześniej ten plik rozgałęział się przez `useIsMobile()` na `Sheet` i
 * `Dialog` — dwa drzewa Reacta z osobnymi nagłówkami i osobną geometrią.
 * `WorkspaceOverlay` robi to samo w CSS, więc obrót telefonu nie remountuje
 * formularza (i nie gubi wpisanych danych).
 */
export function ProjectFormDialog({
  open,
  isSaving,
  editing,
  clients,
  formData,
  onOpenChange,
  onChange,
  onSubmit,
}: Props) {
  const title = editing ? 'Edytuj projekt' : 'Nowy projekt'

  return (
    <WorkspaceOverlay
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={TITLE_DESCRIPTION}
      size="lg"
      layer="stacked"
    >
      <WorkspaceOverlayForm
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <WorkspaceOverlayBody className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="project-name" className={WORKSPACE_FIELD_LABEL}>
              Nazwa projektu *
            </Label>
            <Input
              id="project-name"
              className={WORKSPACE_FIELD}
              value={formData.name}
              onChange={(event) => onChange({ ...formData, name: event.target.value })}
              placeholder="np. Modernizacja linii produkcyjnej"
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="project-description" className={WORKSPACE_FIELD_LABEL}>
              Opis
            </Label>
            <Textarea
              id="project-description"
              className={WORKSPACE_FIELD_MULTILINE}
              value={formData.description || ''}
              onChange={(event) => onChange({ ...formData, description: event.target.value })}
              placeholder="Zakres, ryzyka, założenia..."
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="project-address" className={WORKSPACE_FIELD_LABEL}>
              Adres pracy
            </Label>
            <Input
              id="project-address"
              className={WORKSPACE_FIELD}
              value={formData.address || ''}
              onChange={(event) => onChange({ ...formData, address: event.target.value })}
              placeholder="np. ul. Słoneczna 10, 80-001 Gdańsk"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label className={WORKSPACE_FIELD_LABEL}>Klient</Label>
              <Select
                value={formData.client_id || 'none'}
                onValueChange={(value) =>
                  onChange({ ...formData, client_id: value === 'none' ? '' : value })
                }
              >
                <SelectTrigger className={WORKSPACE_FIELD}>
                  <SelectValue placeholder="Wybierz klienta" />
                </SelectTrigger>
                <SelectContent className={LAYER.stackedPopover}>
                  <SelectItem value="none">Bez klienta</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className={WORKSPACE_FIELD_LABEL}>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Project['status']) =>
                  onChange({ ...formData, status: value })
                }
              >
                <SelectTrigger className={WORKSPACE_FIELD}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={LAYER.stackedPopover}>
                  {PROJECT_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {PROJECT_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label className={WORKSPACE_FIELD_LABEL}>Typ budżetu</Label>
              <Select
                value={formData.budget_type}
                onValueChange={(value: Project['budget_type']) =>
                  onChange({ ...formData, budget_type: value })
                }
              >
                <SelectTrigger className={WORKSPACE_FIELD}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={LAYER.stackedPopover}>
                  {PROJECT_BUDGET_OPTIONS.map((budgetType) => (
                    <SelectItem key={budgetType} value={budgetType}>
                      {PROJECT_BUDGET_LABELS[budgetType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-budget" className={WORKSPACE_FIELD_LABEL}>
                Kwota budżetu (PLN)
              </Label>
              <Input
                id="project-budget"
                className={WORKSPACE_FIELD}
                type="number"
                min={0}
                step="0.01"
                value={formData.budget_amount || ''}
                onChange={(event) =>
                  onChange({ ...formData, budget_amount: Number(event.target.value || 0) })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label className={WORKSPACE_FIELD_LABEL}>Priorytet</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: Project['priority']) =>
                  onChange({ ...formData, priority: value })
                }
              >
                <SelectTrigger className={WORKSPACE_FIELD}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={LAYER.stackedPopover}>
                  {PROJECT_PRIORITY_OPTIONS.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {PRIORITY_LABELS[priority]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="project-target" className={WORKSPACE_FIELD_LABEL}>
                Docelowa ilość (opcjonalnie)
              </Label>
              <Input
                id="project-target"
                className={WORKSPACE_FIELD}
                type="number"
                min={0}
                step="0.01"
                value={formData.target_quantity || ''}
                onChange={(event) =>
                  onChange({ ...formData, target_quantity: Number(event.target.value || 0) })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label className={WORKSPACE_FIELD_LABEL}>Kolor projektu</Label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onChange({ ...formData, color })}
                    className={`h-8 w-8 rounded-full border-2 transition ${
                      formData.color === color ? 'scale-105 border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Wybierz kolor ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="project-start" className={WORKSPACE_FIELD_LABEL}>
                Data startu
              </Label>
              <Input
                id="project-start"
                className={WORKSPACE_FIELD}
                type="date"
                value={formData.start_date || ''}
                onChange={(event) => onChange({ ...formData, start_date: event.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-end" className={WORKSPACE_FIELD_LABEL}>
                Data zakończenia
              </Label>
              <Input
                id="project-end"
                className={WORKSPACE_FIELD}
                type="date"
                value={formData.end_date || ''}
                onChange={(event) => onChange({ ...formData, end_date: event.target.value })}
              />
            </div>
          </div>
        </WorkspaceOverlayBody>

        <WorkspaceOverlayFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button type="submit" variant="accent" disabled={isSaving}>
            {isSaving ? 'Zapisywanie...' : editing ? 'Zapisz zmiany' : 'Dodaj projekt'}
          </Button>
        </WorkspaceOverlayFooter>
      </WorkspaceOverlayForm>
    </WorkspaceOverlay>
  )
}
