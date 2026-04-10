import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PRIORITY_LABELS, PROJECT_STATUS_LABELS, type Client, type Project, type ProjectFormData } from '@/lib/types'

const STATUS_OPTIONS: Project['status'][] = ['planned', 'in_progress', 'completed', 'on_hold']
const PRIORITY_OPTIONS: Project['priority'][] = ['low', 'medium', 'high']
const BUDGET_OPTIONS: Project['budget_type'][] = ['hourly', 'fixed', 'per_unit']

const BUDGET_LABELS: Record<Project['budget_type'], string> = {
  hourly: 'Godzinowy',
  fixed: 'Ryczałtowy',
  per_unit: 'Za jednostkę',
}

type ProjectFormDialogProps = {
  open: boolean
  isSaving: boolean
  editingProject: Project | null
  clients: Client[]
  formData: ProjectFormData
  colorOptions: string[]
  onOpenChange: (open: boolean) => void
  onChange: (value: ProjectFormData) => void
  onSubmit: () => void
}

export function ProjectFormDialog({
  open,
  isSaving,
  editingProject,
  clients,
  formData,
  colorOptions,
  onOpenChange,
  onChange,
  onSubmit,
}: ProjectFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingProject ? 'Edytuj projekt' : 'Nowy projekt'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Nazwa projektu *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(event) => onChange({ ...formData, name: event.target.value })}
              placeholder="np. Modernizacja linii produkcyjnej"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Opis</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(event) => onChange({ ...formData, description: event.target.value })}
              placeholder="Zakres, ryzyka, założenia..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Klient</Label>
              <Select
                value={formData.client_id || 'none'}
                onValueChange={(value) => onChange({ ...formData, client_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz klienta" />
                </SelectTrigger>
                <SelectContent>
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
                onValueChange={(value: Project['status']) => onChange({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {PROJECT_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Typ budżetu</Label>
              <Select
                value={formData.budget_type}
                onValueChange={(value: Project['budget_type']) => onChange({ ...formData, budget_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_OPTIONS.map((budgetType) => (
                    <SelectItem key={budgetType} value={budgetType}>
                      {BUDGET_LABELS[budgetType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budget">Kwota budżetu (PLN)</Label>
              <Input
                id="budget"
                type="number"
                min={0}
                step="0.01"
                value={formData.budget_amount || ''}
                onChange={(event) => onChange({ ...formData, budget_amount: Number(event.target.value || 0) })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Priorytet</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: Project['priority']) => onChange({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {PRIORITY_LABELS[priority]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="target">Docelowa ilość (opcjonalnie)</Label>
              <Input
                id="target"
                type="number"
                min={0}
                step="0.01"
                value={formData.target_quantity || ''}
                onChange={(event) => onChange({ ...formData, target_quantity: Number(event.target.value || 0) })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Kolor projektu</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onChange({ ...formData, color })}
                    className={`h-8 w-8 rounded-full border-2 transition ${
                      formData.color === color ? 'scale-105 border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Wybierz kolor ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Data startu</Label>
              <Input
                id="start-date"
                type="date"
                value={formData.start_date || ''}
                onChange={(event) => onChange({ ...formData, start_date: event.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="end-date">Data zakończenia</Label>
              <Input
                id="end-date"
                type="date"
                value={formData.end_date || ''}
                onChange={(event) => onChange({ ...formData, end_date: event.target.value })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button onClick={onSubmit} disabled={isSaving}>
            {isSaving ? 'Zapisywanie...' : editingProject ? 'Zapisz zmiany' : 'Dodaj projekt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
