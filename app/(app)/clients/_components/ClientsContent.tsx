'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { useClientsData } from '../_hooks/useClientsData'
import { useClientsFilters } from '../_hooks/useClientsFilters'
import { useClientRatesMap } from '../_hooks/useClientRates'
import {
  useCreateClient,
  useDeleteClient,
  useUpdateClient,
} from '../_hooks/useClientMutations'
import { useCurrentUser } from '@/hooks/auth/useCurrentUser'
import { useIsMobile } from '@/hooks/use-mobile'
import { ClientsHeader } from './ClientsHeader'
import { ClientsStats } from './ClientsStats'
import { ClientsTable } from './ClientsTable'
import { ClientsMobileList } from './ClientsMobileList'
import { ClientsEmpty } from './ClientsEmpty'
import { ClientFormDialog } from './ClientFormDialog'
import { DeleteClientDialog } from './DeleteClientDialog'
import { RateHistoryDialog } from './RateHistoryDialog'
import { ClientsStatsBoundary, ClientsTableBoundary } from './errors'
import type { Client, ClientFormData } from '@/lib/types'
import type { ClientWithStats } from '../_domain/clients.types'

export function ClientsContent() {
  const { data }                    = useClientsData()
  const { data: authUser }          = useCurrentUser()
  const userId                      = authUser?.id ?? null
  const { data: rateHistoryMap = {} } = useClientRatesMap(userId ?? '')
  const isMobile                    = useIsMobile()

  const {
    search,
    setSearch,
    workTypeFilter,
    setWorkTypeFilter,
    currencyFilter,
    setCurrencyFilter,
    allWithStats,
    visible,
  } = useClientsFilters(data.clients, data.workEntries, rateHistoryMap)

  const createMutation = useCreateClient(userId ?? undefined)
  const updateMutation = useUpdateClient(userId ?? undefined)
  const deleteMutation = useDeleteClient()

  const [formOpen,      setFormOpen]      = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<Client | null>(null)
  const [historyClient,   setHistoryClient]   = useState<Client | null>(null)

  const isSaving = createMutation.isPending || updateMutation.isPending

  const openCreate = useCallback(() => {
    setEditingClient(null)
    setFormOpen(true)
  }, [])

  const openEdit = useCallback((c: ClientWithStats) => {
    setEditingClient(toClient(c))
    setFormOpen(true)
  }, [])

  const closeForm = useCallback(() => {
    if (isSaving) return
    setFormOpen(false)
    setEditingClient(null)
  }, [isSaving])

  const handleSubmit = useCallback(
    (form: ClientFormData) => {
      if (editingClient) {
        updateMutation.mutate(
          { id: editingClient.id, form },
          { onSuccess: () => closeForm() },
        )
      } else {
        createMutation.mutate(form, { onSuccess: () => closeForm() })
      }
    },
    [editingClient, updateMutation, createMutation, closeForm],
  )

  const clearFilters = useCallback(() => {
    setSearch('')
    setWorkTypeFilter('all')
    setCurrencyFilter('all')
  }, [setSearch, setWorkTypeFilter, setCurrencyFilter])

  const allClients = useMemo(() => data.clients, [data.clients])

  const router = useRouter()
  const searchParams = useSearchParams()
  const quickAddTriggered = useRef(false)

  // Quick Action z sidebara (`/clients?new=1`) — auto-otwarcie formularza nowego klienta.
  useEffect(() => {
    if (quickAddTriggered.current) return
    if (searchParams.get('new') !== '1') return
    quickAddTriggered.current = true
    openCreate()
    const params = new URLSearchParams(searchParams.toString())
    params.delete('new')
    const query = params.toString()
    router.replace(query ? `/clients?${query}` : '/clients', { scroll: false })
  }, [searchParams, openCreate, router])

  return (
    <div className="container space-y-6 px-4 py-6">
      <ClientsHeader
        totalCount={allClients.length}
        visibleCount={visible.length}
        search={search}
        onSearchChange={setSearch}
        workTypeFilter={workTypeFilter}
        onWorkTypeFilterChange={setWorkTypeFilter}
        currencyFilter={currencyFilter}
        onCurrencyFilterChange={setCurrencyFilter}
        onAddClient={openCreate}
      />

      {allClients.length > 0 && (
        <ClientsStatsBoundary>
          <ClientsStats clients={allWithStats} />
        </ClientsStatsBoundary>
      )}

      {visible.length === 0 ? (
        <ClientsEmpty
          hasAnyClient={allClients.length > 0}
          onAddClient={openCreate}
          onClearFilters={clearFilters}
        />
      ) : isMobile ? (
        <ClientsTableBoundary>
          <ClientsMobileList
            clients={visible}
            workTypeFilter={workTypeFilter}
            onWorkTypeFilterChange={setWorkTypeFilter}
            currencyFilter={currencyFilter}
            onCurrencyFilterChange={setCurrencyFilter}
            onClearFilters={clearFilters}
            onEdit={openEdit}
            onDelete={(c) => setDeleteCandidate(toClient(c))}
            onShowHistory={(c) => setHistoryClient(toClient(c))}
          />
        </ClientsTableBoundary>
      ) : (
        <ClientsTableBoundary>
          <Card className="overflow-hidden">
            <ClientsTable
              clients={visible}
              onEdit={openEdit}
              onDelete={(c) => setDeleteCandidate(toClient(c))}
              onShowHistory={(c) => setHistoryClient(toClient(c))}
            />
          </Card>
        </ClientsTableBoundary>
      )}

      <ClientFormDialog
        open={formOpen}
        client={editingClient}
        isSaving={isSaving}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      <DeleteClientDialog
        client={deleteCandidate}
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteCandidate) return
          deleteMutation.mutate(deleteCandidate.id, {
            onSuccess: () => setDeleteCandidate(null),
          })
        }}
        onClose={() => setDeleteCandidate(null)}
      />

      <RateHistoryDialog
        userId={userId ?? ''}
        client={historyClient}
        open={Boolean(historyClient)}
        onClose={() => setHistoryClient(null)}
      />
    </div>
  )
}

/** ClientWithStats → Client (usuwamy pola wyliczane) */
function toClient(c: ClientWithStats): Client {
  const {
    totalEarningsInClientCurrency: _e,
    totalHours:        _h,
    totalDays:         _d,
    workEntriesCount:  _w,
    lastEntryDate:     _l,
    rateHistoryCount:  _r,
    ...client
  } = c
  return client
}
