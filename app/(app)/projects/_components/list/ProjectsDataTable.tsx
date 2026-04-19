'use client'

import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable, createSelectionColumn, type DataTableFilter } from '@/components/common/data-table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  PROJECT_STATUS_FILTER_OPTIONS
} from '../../_domain/projects.constants'

type ProjectsDataTableProps = {
  data: Project[]
  clients: Client[]
  onAddProject: () => void
  onEditProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
}

export function ProjectsDataTable({
  data,
  clients,
  onAddProject,
  onEditProject,
  onDeleteProject,
}: ProjectsDataTableProps) {
  const clientsById = useMemo(() => new Map(clients.map((client) => [client.id, client.name])), [clients])

  const columns = useMemo<ColumnDef<Project, unknown>[]>(
    () => [
      createSelectionColumn<Project>(),
      {
        accessorKey: 'name',
        header: 'Projekt',
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
        accessorFn: (project) => clientsById.get(project.client_id) ?? 'No client',
        header: 'Klient',
        size: 180,
      },
      {
        accessorKey: 'status',
        header: 'Status',
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
        size: 120,
        cell: ({ row }) =>
          row.original.budget_amount ? formatCurrency(row.original.budget_amount, 'PLN') : '—',
      },
      {
        accessorKey: 'end_date',
        header: 'Termin',
        size: 130,
        cell: ({ row }) => (row.original.end_date ? formatDate(row.original.end_date) : '—'),
      },
      {
        id: 'actions',
        enableHiding: false,
        enableSorting: false,
        size: 50,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => onEditProject(row.original)}>
                <Pencil className="mr-2 size-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDeleteProject(row.original)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [clientsById, onDeleteProject, onEditProject],
  )

  const filters = useMemo<DataTableFilter[]>(
    () => [
      {
        columnId: 'status',
        label: 'Status',
        type: 'chips',
        options: PROJECT_STATUS_FILTER_OPTIONS
      },
      {
        columnId: 'priority',
        label: 'Priority',
        type: 'select',
        options: [
          { label: 'Niski', value: 'low' },
          { label: 'Średni', value: 'medium' },
          { label: 'Wysoki', value: 'high' },
        ],
      },
    ],
    [],
  )

  return (
    <DataTable
      data={data}
      columns={columns}
      filters={filters}
      onAddRow={onAddProject}
      onDeleteRows={(rows) => rows.forEach((project) => onDeleteProject(project))}
      searchPlaceholder="Wyszukaj projekt, klientów, status..."
      emptyLabel="Brak pasujących projektów. Spróbuj zmienić filtry lub frazę wyszukiwania."
      initialVisibility={{ budget_amount: false }}
    />
  )
}
