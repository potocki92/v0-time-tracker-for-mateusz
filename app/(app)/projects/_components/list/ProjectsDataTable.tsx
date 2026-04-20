'use client'

import { useMemo } from 'react'
import { DataTable, type DataTableFilter } from '@/components/common/data-table'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  PROJECT_STATUS_FILTER_OPTIONS,
} from '../../_domain/projects.constants'
import type { Client, Project } from '@/lib/types'
import { columns, type ProjectsTableMeta } from './columns'
import { ProjectsMobileAccordion } from './ProjectsMobileAccordion'

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
  const isMobile = useIsMobile()
  const clientsById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients])

  const tableMeta = useMemo<ProjectsTableMeta>(
    () => ({ clientsById, onDeleteProject, onEditProject }),
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

  if (isMobile) {
    return (
      <ProjectsMobileAccordion
        data={data}
        clients={clients}
        onEditProject={onEditProject}
        onDeleteProject={onDeleteProject}
      />
    )
  }

  return (
    <DataTable
      data={data}
      columns={columns}
      meta={tableMeta}
      filters={filters}
      storageKey={{ filters: 'projects-table-filters-v1', layout: 'projects-table-layout-v1' }}
      onAddRow={onAddProject}
      onDeleteRows={(rows) => rows.forEach((project) => onDeleteProject(project))}
      searchPlaceholder="Wyszukaj projekt, klientów, status..."
      emptyLabel="Brak pasujących projektów. Spróbuj zmienić filtry lub frazę wyszukiwania."
      initialVisibility={{ budget_amount: false }}
      enableColumnDnd
    />
  )
}
