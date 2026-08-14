'use client'

import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
 * Formularz otwiera się nad panelem szczegółów projektu (drawer w drawerze),
 * więc obie warstwy dostają z-index ponad Sheetem (z-50) i własny, wyraźnie
 * przyciemniony overlay — inaczej druga warstwa zlewałaby się z pierwszą.
 */
const STACKED_LAYER = 'z-[60]'
const STACKED_OVERLAY = 'z-[60] bg-black/60 backdrop-blur-sm'
/** Listy selectów portalują się do body z bazowym z-50, więc bez podbicia
 *  chowają się pod overlayem formularza — kliknięcie trafiało w overlay. */
const STACKED_POPOVER = 'z-[70]'

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
  const isMobile = useIsMobile()
  const title = editing ? 'Edytuj projekt' : 'Nowy projekt'

  const form = (
        <form
          className="grid gap-4 py-1"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="project-name">Nazwa projektu *</Label>
            <Input
              id="project-name"
              value={formData.name}
              onChange={(event) => onChange({ ...formData, name: event.target.value })}
              placeholder="np. Modernizacja linii produkcyjnej"
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="project-description">Opis</Label>
            <Textarea
              id="project-description"
              value={formData.description || ''}
              onChange={(event) => onChange({ ...formData, description: event.target.value })}
              placeholder="Zakres, ryzyka, założenia..."
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="project-address">Adres pracy</Label>
            <Input
              id="project-address"
              value={formData.address || ''}
              onChange={(event) => onChange({ ...formData, address: event.target.value })}
              placeholder="np. ul. Słoneczna 10, 80-001 Gdańsk"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Klient</Label>
              <Select
                value={formData.client_id || 'none'}
                onValueChange={(value) =>
                  onChange({ ...formData, client_id: value === 'none' ? '' : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz klienta" />
                </SelectTrigger>
                <SelectContent className={STACKED_POPOVER}>
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
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Project['status']) =>
                  onChange({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={STACKED_POPOVER}>
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
              <Label>Typ budżetu</Label>
              <Select
                value={formData.budget_type}
                onValueChange={(value: Project['budget_type']) =>
                  onChange({ ...formData, budget_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={STACKED_POPOVER}>
                  {PROJECT_BUDGET_OPTIONS.map((budgetType) => (
                    <SelectItem key={budgetType} value={budgetType}>
                      {PROJECT_BUDGET_LABELS[budgetType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-budget">Kwota budżetu (PLN)</Label>
              <Input
                id="project-budget"
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
              <Label>Priorytet</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: Project['priority']) =>
                  onChange({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={STACKED_POPOVER}>
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
              <Label htmlFor="project-target">Docelowa ilość (opcjonalnie)</Label>
              <Input
                id="project-target"
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
              <Label>Kolor projektu</Label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onChange({ ...formData, color })}
                    className={`h-8 w-8 rounded-full border-2 transition ${
                      formData.color === color
                        ? 'scale-105 border-foreground'
                        : 'border-transparent'
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
              <Label htmlFor="project-start">Data startu</Label>
              <Input
                id="project-start"
                type="date"
                value={formData.start_date || ''}
                onChange={(event) => onChange({ ...formData, start_date: event.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-end">Data zakończenia</Label>
              <Input
                id="project-end"
                type="date"
                value={formData.end_date || ''}
                onChange={(event) => onChange({ ...formData, end_date: event.target.value })}
              />
            </div>
          </div>

          <div className="mt-2 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Zapisywanie...' : editing ? 'Zapisz zmiany' : 'Dodaj projekt'}
            </Button>
          </div>
        </form>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className={`${STACKED_LAYER} max-h-[92dvh] gap-0 overflow-y-auto rounded-t-2xl px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-4`}
          overlayClassName={STACKED_OVERLAY}
        >
          <SheetHeader className="p-0 pb-4">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{TITLE_DESCRIPTION}</SheetDescription>
          </SheetHeader>
          {form}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${STACKED_LAYER} max-h-[92vh] overflow-y-auto sm:max-w-2xl`}
        overlayClassName={STACKED_OVERLAY}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{TITLE_DESCRIPTION}</DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  )
}
