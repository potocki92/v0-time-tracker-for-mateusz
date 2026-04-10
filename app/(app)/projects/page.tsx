'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  FolderKanban,
  Plus,
  Pencil,
  Trash2,
  Clock3,
  CircleDollarSign,
  ListTodo,
  Building2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Client, Project, ProjectFormData, WorkEntry } from '@/lib/types'
import { PROJECT_STATUS_LABELS, PRIORITY_LABELS } from '@/lib/types'
import { formatCurrency } from '@/lib/helpers'

const STATUS_OPTIONS: Project['status'][] = ['planned', 'in_progress', 'completed', 'on_hold']
const PRIORITY_OPTIONS: Project['priority'][] = ['low', 'medium', 'high']
const BUDGET_OPTIONS: Project['budget_type'][] = ['hourly', 'fixed', 'per_unit']
const COLOR_OPTIONS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#64748b']

const statusBadgeClass: Record<Project['status'], string> = {
  planned: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
  in_progress: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  on_hold: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
}

export default function ProjectsPage() {
  const supabase = createClient()

  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  const [formData, setFormData] = useState<ProjectFormData>({
    client_id: '',
    name: '',
    description: '',
    status: 'planned',
    budget_type: 'hourly',
    budget_amount: 0,
    target_quantity: 0,
    priority: 'medium',
    color: COLOR_OPTIONS[0],
    start_date: '',
    end_date: '',
  })

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      const [projectsRes, clientsRes, entriesRes] = await Promise.all([
        supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('clients').select('*').eq('user_id', user.id).order('name'),
        supabase.from('work_entries').select('*').eq('user_id', user.id),
      ])

      if (projectsRes.error) throw projectsRes.error
      if (clientsRes.error) throw clientsRes.error
      if (entriesRes.error) throw entriesRes.error

      setProjects((projectsRes.data ?? []) as Project[])
      setClients((clientsRes.data ?? []) as Client[])
      setWorkEntries((entriesRes.data ?? []) as WorkEntry[])
    } catch (error) {
      console.error('Blad ladowania projektow:', error)
      toast.error('Nie udalo sie zaladowac projektow')
    } finally {
      setIsLoading(false)
    }
  }

  const stats = useMemo(() => {
    const active = projects.filter((p) => p.status === 'in_progress').length
    const completed = projects.filter((p) => p.status === 'completed').length
    const planned = projects.filter((p) => p.status === 'planned').length

    const totalBudget = projects.reduce((sum, project) => sum + Number(project.budget_amount ?? 0), 0)

    return { active, completed, planned, totalBudget }
  }, [projects])

  const progressByProject = useMemo(() => {
    const map = new Map<string, number>()

    projects.forEach((project) => {
      const target = Number(project.target_quantity ?? 0)
      if (!target || target <= 0) {
        map.set(project.id, 0)
        return
      }

      const quantityDone = workEntries
        .filter((entry) => entry.project_id === project.id)
        .reduce((sum, entry) => sum + Number(entry.quantity ?? 0), 0)

      map.set(project.id, Math.min(100, (quantityDone / target) * 100))
    })

    return map
  }, [projects, workEntries])

  function openCreateModal() {
    setEditingProject(null)
    setFormData({
      client_id: clients[0]?.id ?? '',
      name: '',
      description: '',
      status: 'planned',
      budget_type: 'hourly',
      budget_amount: 0,
      target_quantity: 0,
      priority: 'medium',
      color: COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)],
      start_date: '',
      end_date: '',
    })
    setIsModalOpen(true)
  }

  function openEditModal(project: Project) {
    setEditingProject(project)
    setFormData({
      client_id: project.client_id ?? '',
      name: project.name,
      description: project.description ?? '',
      status: project.status,
      budget_type: project.budget_type,
      budget_amount: Number(project.budget_amount ?? 0),
      target_quantity: Number(project.target_quantity ?? 0),
      priority: project.priority,
      color: project.color,
      start_date: project.start_date ?? '',
      end_date: project.end_date ?? '',
    })
    setIsModalOpen(true)
  }

  async function saveProject() {
    if (!formData.name.trim()) {
      toast.error('Nazwa projektu jest wymagana')
      return
    }

    setIsSaving(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Brak autoryzacji')
        return
      }

      const payload = {
        user_id: user.id,
        client_id: formData.client_id || null,
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        status: formData.status,
        budget_type: formData.budget_type,
        budget_amount: formData.budget_amount && formData.budget_amount > 0 ? formData.budget_amount : null,
        target_quantity: formData.target_quantity && formData.target_quantity > 0 ? formData.target_quantity : null,
        priority: formData.priority,
        color: formData.color,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      }

      if (editingProject) {
        const { error } = await supabase.from('projects').update(payload).eq('id', editingProject.id)
        if (error) throw error
        toast.success('Projekt zostal zaktualizowany')
      } else {
        const { error } = await supabase.from('projects').insert(payload)
        if (error) throw error
        toast.success('Projekt zostal dodany')
      }

      setIsModalOpen(false)
      await loadData()
    } catch (error) {
      console.error('Blad zapisu projektu:', error)
      toast.error('Nie udalo sie zapisac projektu')
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteProject() {
    if (!projectToDelete) return

    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectToDelete.id)
      if (error) throw error

      toast.success('Projekt zostal usuniety')
      setProjectToDelete(null)
      await loadData()
    } catch (error) {
      console.error('Blad usuwania projektu:', error)
      toast.error('Nie udalo sie usunac projektu')
    }
  }

  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'Bez klienta'
    return clients.find((client) => client.id === clientId)?.name ?? 'Nieznany klient'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Ladowanie projektow...</div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projekty</h1>
          <p className="text-muted-foreground">Planowanie, budzety i postep prac w jednym miejscu.</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj projekt
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <ListTodo className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">W trakcie</p>
                <p className="text-2xl font-semibold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Zakonczone</p>
                <p className="text-2xl font-semibold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Clock3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Planowane</p>
                <p className="text-2xl font-semibold">{stats.planned}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                <CircleDollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Suma budzetow</p>
                <p className="text-xl font-semibold">{formatCurrency(stats.totalBudget, 'PLN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {projects.length === 0 ? (
        <Card className="py-14">
          <CardContent className="text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">Brak projektow</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Dodaj pierwszy projekt, aby monitorowac postep, budzet oraz przypisac zadania do klientow.
            </p>
            <Button onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-2" />
              Utworz pierwszy projekt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((project) => {
            const progress = progressByProject.get(project.id) ?? 0

            return (
              <Card key={project.id} className="relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: project.color }} />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={statusBadgeClass[project.status]}>
                          {PROJECT_STATUS_LABELS[project.status]}
                        </Badge>
                        <Badge variant="secondary">Priorytet: {PRIORITY_LABELS[project.priority]}</Badge>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditModal(project)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setProjectToDelete(project)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> Klient
                      </p>
                      <p className="font-medium">{getClientName(project.client_id)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Budzet</p>
                      <p className="font-medium">
                        {project.budget_amount ? formatCurrency(project.budget_amount, 'PLN') : 'Brak'}
                      </p>
                    </div>
                  </div>

                  {project.target_quantity && project.target_quantity > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Postep realizacji</span>
                        <span className="font-medium">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="np. Modernizacja linii produkcyjnej"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Opis</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Zakres, ryzyka, zalozenia..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Klient</Label>
                <Select value={formData.client_id || 'none'} onValueChange={(value) => setFormData((prev) => ({ ...prev, client_id: value === 'none' ? '' : value }))}>
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
                  onValueChange={(value: Project['status']) => setFormData((prev) => ({ ...prev, status: value }))}
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
                <Label>Typ budzetu</Label>
                <Select
                  value={formData.budget_type}
                  onValueChange={(value: Project['budget_type']) => setFormData((prev) => ({ ...prev, budget_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_OPTIONS.map((budgetType) => (
                      <SelectItem key={budgetType} value={budgetType}>
                        {budgetType === 'hourly' ? 'Godzinowy' : budgetType === 'fixed' ? 'Ryczaltowy' : 'Za jednostke'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="budget">Budzet (PLN)</Label>
                <Input
                  id="budget"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.budget_amount || ''}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, budget_amount: Number(event.target.value || 0) }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>Priorytet</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: Project['priority']) => setFormData((prev) => ({ ...prev, priority: value }))}
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
                <Label htmlFor="target">Docelowa ilosc (opcjonalnie)</Label>
                <Input
                  id="target"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.target_quantity || ''}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, target_quantity: Number(event.target.value || 0) }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>Kolor projektu</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, color }))}
                      className={`h-8 w-8 rounded-full border-2 transition ${
                        formData.color === color ? 'border-foreground scale-105' : 'border-transparent'
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
                  onChange={(event) => setFormData((prev) => ({ ...prev, start_date: event.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="end-date">Data zakonczenia</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={formData.end_date || ''}
                  onChange={(event) => setFormData((prev) => ({ ...prev, end_date: event.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={saveProject} disabled={isSaving}>
              {isSaving ? 'Zapisywanie...' : editingProject ? 'Zapisz zmiany' : 'Dodaj projekt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Usunac projekt?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Ta operacja jest nieodwracalna. Projekt <span className="font-medium text-foreground">{projectToDelete?.name}</span> zostanie usuniety.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectToDelete(null)}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={deleteProject}>
              Usun projekt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
