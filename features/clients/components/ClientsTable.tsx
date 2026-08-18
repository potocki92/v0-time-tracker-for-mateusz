'use client'

import { useMemo } from 'react'
import { DataTable, type DataTableFilter } from '@/components/common/data-table'
import type { ClientWithStats } from '../domain/clients.types'
import { columns, type ClientsTableMeta } from './columns'

type Props = {
  clients: ClientWithStats[]
  onEdit: (client: ClientWithStats) => void
  onDelete: (client: ClientWithStats) => void
  onShowHistory: (client: ClientWithStats) => void
}

/**
 * `hours` było domyślnie ukryte — na desktopie godziny i zarobki, czyli jedyne
 * liczby mówiące cokolwiek o biznesie, w ogóle nie trafiały na ekran.
 * `currency` zostaje ukryte: waluta jest już widoczna przy stawce i zarobkach.
 */
const INITIAL_VISIBILITY = { currency: false }

export function ClientsTable({ clients, onEdit, onDelete, onShowHistory }: Props) {
  const tableMeta = useMemo<ClientsTableMeta>(
    () => ({ onEdit, onDelete, onShowHistory }),
    [onDelete, onEdit, onShowHistory],
  )

  const filters = useMemo<DataTableFilter[]>(() => [
    {
      columnId: 'work_type',
      label: 'Typ rozliczenia',
      type: 'chips',
      options: [
        { label: 'Wszystkie', value: 'all' },
        { label: 'Godzinowe', value: 'hourly' },
        { label: 'Akord', value: 'piecework' },
      ],
    },
    {
      columnId: 'currency',
      label: 'Waluta',
      type: 'select',
      options: [
        { label: 'PLN', value: 'PLN' },
        { label: 'EUR', value: 'EUR' },
      ],
    },
  ], [])

  return (
    <DataTable
      data={clients}
      columns={columns}
      meta={tableMeta}
      filters={filters}
      storageKey={{ filters: 'clients-table-filters-v1', layout: 'clients-table-layout-v1' }}
      searchPlaceholder="Szukaj klientów po nazwie, mieście, e-mailu..."
      emptyLabel="Brak klientów spełniających kryteria."
      initialVisibility={INITIAL_VISIBILITY}
      enableColumnDnd
    />
  )
}
