'use client'

import { useCallback, useState } from 'react'
import type { Client, Project, ProjectFormData } from '@/lib/types'
import { PROJECT_COLOR_OPTIONS } from '../_domain/projects.constants'

function randomColor(): string {
  return PROJECT_COLOR_OPTIONS[Math.floor(Math.random() * PROJECT_COLOR_OPTIONS.length)]
}

function emptyFormData(clients: Client[]): ProjectFormData {
  return {
    client_id: clients[0]?.id ?? '',
    name: '',
    description: '',
    status: 'planned',
    budget_type: 'hourly',
    budget_amount: 0,
    target_quantity: 0,
    priority: 'medium',
    color: randomColor(),
    start_date: '',
    end_date: '',
  }
}

function toFormData(project: Project): ProjectFormData {
  return {
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
  }
}

export function useProjectForm(clients: Client[]) {
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [formData, setFormData] = useState<ProjectFormData>(() => emptyFormData(clients))

  const openCreate = useCallback(() => {
    setEditing(null)
    setFormData(emptyFormData(clients))
    setIsOpen(true)
  }, [clients])

  const openEdit = useCallback((project: Project) => {
    setEditing(project)
    setFormData(toFormData(project))
    setIsOpen(true)
  }, [])

  const close = useCallback(() => setIsOpen(false), [])

  return {
    isOpen,
    editing,
    formData,
    setFormData,
    setIsOpen,
    openCreate,
    openEdit,
    close,
  }
}
