'use client'

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createSelectionColumn } from '@/components/common/data-table'
import { formatCurrency, formatDate } from '@/lib/helpers'
import {
  PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  type Client,
  type Project,
} from '@/lib/types'
import {
  PROJECT_PRIORITY_BADGE_CLASS,
  PROJECT_STATUS_BADGE_CLASS,
} from '../../_domain/projects.constants'

export type ProjectsTableMeta = {
  clientsById: Map<string, Client>
  onEditProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
}

export const columns: ColumnDef<Project>[] = [
  createSelectionColumn<Project>(),
  {
    accessorKey: 'name',
    header: 'Projekt',
    meta: { label: 'Projekt' },
    minSize: 240,
    size: 300,
    cell: ({ row }) => {
      const project = row.original
      return (
        <div className="flex min-w-0 items-center gap-2">
          <div className="avatar-ring rounded-full p-[2px]">
            <Avatar className="size-7 border border-zinc-200/80 dark:border-zinc-700/80">
              <AvatarFallback
                className="text-[10px] font-semibold text-zinc-900 dark:text-zinc-100"
                style={{ backgroundColor: `${project.color}30` }}
              >
                {project.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{project.name}</p>
            {project.description && (
              <p className="line-clamp-1 text-xs text-muted-foreground">{project.description}</p>
            )}
          </div>
        </div>
      )
    },
  },
  {
    id: 'client',
    accessorFn: (project) => project.client_id ?? 'no-client',
    header: 'Klient',
    meta: { label: 'Klient' },
    size: 180,
    cell: ({ row, table }) => {
      const meta = table.options.meta as ProjectsTableMeta | undefined
      const client = row.original.client_id ? meta?.clientsById.get(row.original.client_id) : undefined
      const label = client?.name ?? 'Brak klienta'
      return (
        <span className="block max-w-full truncate" title={label}>
          {label}
        </span>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { label: 'Status' },
    size: 150,
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge variant="outline" className={PROJECT_STATUS_BADGE_CLASS[status]}>
          {PROJECT_STATUS_LABELS[status]}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'priority',
    header: 'Priorytet',
    meta: { label: 'Priorytet' },
    size: 130,
    cell: ({ row }) => {
      const priority = row.original.priority
      return (
        <Badge variant="outline" className={PROJECT_PRIORITY_BADGE_CLASS[priority]}>
          {PRIORITY_LABELS[priority]}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'budget_amount',
    header: 'Budżet',
    meta: { label: 'Budżet' },
    size: 120,
    cell: ({ row }) =>
      row.original.budget_amount ? formatCurrency(row.original.budget_amount, 'PLN') : '—',
  },
  {
    accessorKey: 'end_date',
    header: 'Termin',
    meta: { label: 'Termin' },
    size: 130,
    cell: ({ row }) => (row.original.end_date ? formatDate(row.original.end_date) : '—'),
  },
  {
    id: 'actions',
    enableHiding: false,
    enableSorting: false,
    size: 50,
    cell: ({ row, table }) => {
      const meta = table.options.meta as ProjectsTableMeta | undefined

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" aria-label="Akcje projektu">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" collisionPadding={8} className="min-w-[9rem]">
            <DropdownMenuItem onClick={() => meta?.onEditProject(row.original)}>
              <Pencil className="mr-2 size-4" /> Edytuj
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => meta?.onDeleteProject(row.original)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" /> Usuń
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
