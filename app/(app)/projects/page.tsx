'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, FolderKanban, Plus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { toast } from 'sonner'
import type { Client, Project, ProjectFormData, WorkEntry } from '@/lib/types'
import { ProjectCard } from './_components/project-card'
import { ProjectFormDialog } from './_components/project-form-dialog'
import { ProjectStats } from './_components/project-stats'

const COLOR_OPTIONS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#64748b']

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
  const [searchTerm, setSearchTerm] = useState('')

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
      toast.error('Nie udało się załadować projektów')
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

  const clientNameById = useMemo(() => {
    return new Map(clients.map((client) => [client.id, client.name]))
  }, [clients])

  const filteredProjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    if (!query) return projects

    return projects.filter((project) => {
      const clientName = project.client_id ? clientNameById.get(project.client_id) ?? '' : ''

      return project.name.toLowerCase().includes(query) || clientName.toLowerCase().includes(query)
    })
  }, [projects, searchTerm, clientNameById])

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
        toast.success('Projekt został zaktualizowany')
      } else {
        const { error } = await supabase.from('projects').insert(payload)
        if (error) throw error
        toast.success('Projekt został dodany')
      }

      setIsModalOpen(false)
      await loadData()
    } catch (error) {
      console.error('Blad zapisu projektu:', error)
      toast.error('Nie udało się zapisać projektu')
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteProject() {
    if (!projectToDelete) return

    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectToDelete.id)
      if (error) throw error

      toast.success('Projekt został usunięty')
      setProjectToDelete(null)
      await loadData()
    } catch (error) {
      console.error('Blad usuwania projektu:', error)
      toast.error('Nie udało się usunąć projektu')
    }
  }

  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'Bez klienta'
    return clients.find((client) => client.id === clientId)?.name ?? 'Nieznany klient'
  }

  return (
    <div className="container space-y-6 px-4 py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projekty</h1>
          <p className="text-muted-foreground">Planowanie, budżety i postęp prac w jednym miejscu.</p>
        </div>
        <Button onClick={openCreateModal} className="bg-emerald-600 text-white hover:bg-emerald-700 md:ml-auto">
          <Plus className="mr-2 h-4 w-4" />
          Dodaj projekt
        </Button>
      </div>

      <ProjectStats {...stats} />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="pl-9"
          placeholder="Szukaj po nazwie projektu lub kliencie..."
        />
      </div>

      {projects.length === 0 ? (
        <Empty className="py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderKanban className="h-5 w-5" />
            </EmptyMedia>
            <EmptyTitle>Brak projektów</EmptyTitle>
            <EmptyDescription>
              Dodaj pierwszy projekt, aby monitorować postęp, budżet oraz przypisać zadania do klientów.
            </EmptyDescription>
          </EmptyHeader>
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Utwórz pierwszy projekt
          </Button>
        </Empty>
      ) : filteredProjects.length === 0 ? (
        <Empty className="py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search className="h-5 w-5" />
            </EmptyMedia>
            <EmptyTitle>Brak wyników wyszukiwania</EmptyTitle>
            <EmptyDescription>Nie znaleziono projektów pasujących do frazy „{searchTerm}”.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              clientName={getClientName(project.client_id)}
              progress={progressByProject.get(project.id) ?? 0}
              onEdit={openEditModal}
              onDelete={setProjectToDelete}
            />
          ))}
        </div>
      )}

      <ProjectFormDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        isSaving={isSaving}
        editingProject={editingProject}
        clients={clients}
        formData={formData}
        colorOptions={COLOR_OPTIONS}
        onChange={setFormData}
        onSubmit={saveProject}
      />

      <Dialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Usunąć projekt?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Ta operacja jest nieodwracalna. Projekt <span className="font-medium text-foreground">{projectToDelete?.name}</span>{' '}
            zostanie usunięty.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectToDelete(null)}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={deleteProject}>
              Usuń projekt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
