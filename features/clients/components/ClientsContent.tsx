'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { WorkspaceHeaderActions } from '@/components/workspace/workspace-header-slot'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useClientsData } from '../hooks/useClientsData'
import { useClientsFilters } from '../hooks/useClientsFilters'
import { useClientRatesMap } from '../hooks/useClientRates'
import {
  useCreateClient,
  useDeleteClient,
  useUpdateClient,
} from '../hooks/useClientMutations'
import { useIsMobile } from '@/hooks/use-mobile'
import { ClientsStats } from './ClientsStats'
import { CurrentClientCard } from './CurrentClientCard'
import {
  selectClientMonthStats,
  selectCurrentClient,
} from '../domain/clients.selectors'
import { ClientsTable } from './ClientsTable'
import { ClientsMobileList } from './ClientsMobileList'
import { ClientsEmpty } from './ClientsEmpty'
import { ClientFormDialog } from './ClientFormDialog'
import { DeleteClientDialog } from './DeleteClientDialog'
import { RateHistoryDialog } from './RateHistoryDialog'
import { AppFooter } from '@/components/common/AppFooter'
import { PageContainer } from '@/components/common/section/PageContainer'
import { ClientsStatsBoundary, ClientsTableBoundary } from './errors'
import type { Client, ClientFormData } from '@/lib/types'
import type { ClientWithStats } from '../domain/clients.types'

export function ClientsContent() {
  const { data }                    = useClientsData()
  const { data: rateHistoryMap = {} } = useClientRatesMap()
  const isMobile                    = useIsMobile()

  const {
    search,
    setSearch,
    workTypeFilter,
    setWorkTypeFilter,
    currencyFilter,
    setCurrencyFilter,
    activityFilter,
    setActivityFilter,
    sortKey,
    setSort,
    activeFilterCount,
    allWithStats,
    visible,
  } = useClientsFilters(data.clients, data.workEntries, rateHistoryMap)

  const createMutation = useCreateClient()
  const updateMutation = useUpdateClient()
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
    setActivityFilter('all')
  }, [setSearch, setWorkTypeFilter, setCurrencyFilter, setActivityFilter])

  const allClients = useMemo(() => data.clients, [data.clients])

  // Karta hero ma sens tylko przy pełnej liście — przy zawężonym widoku
  // „aktualny zleceniodawca" mógłby nie mieć nic wspólnego z tym, co widać niżej.
  const isBrowsingAll = search.trim() === '' && activeFilterCount === 0
  const currentClient = useMemo(
    () => (isBrowsingAll ? selectCurrentClient(allWithStats) : null),
    [isBrowsingAll, allWithStats],
  )
  const currentClientMonth = useMemo(
    () => (currentClient ? selectClientMonthStats(currentClient, data.workEntries) : null),
    [currentClient, data.workEntries],
  )

  // Na telefonie karta hero to pełnoekranowa wersja tego samego kafelka —
  // zostawienie go też na liście kosztowało cały ekran przewijania.
  // Tabela na desktopie zostaje kompletna: brakujący wiersz w siatce danych
  // (z własnym sortowaniem i licznikiem) myliłby bardziej, niż pomagał.
  const listClients = useMemo(
    () => (currentClient ? visible.filter((c) => c.id !== currentClient.id) : visible),
    [visible, currentClient],
  )

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
    <PageContainer>
      {/* Tytul sekcji zyje w breadcrumbie górnego paska — tu zostaje sam
          naglowek dla czytnikow ekranu, zeby strona miala h1. */}
      <h1 className="sr-only">Klienci</h1>

      <WorkspaceHeaderActions>
        <Button variant="accent" size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Dodaj klienta
        </Button>
      </WorkspaceHeaderActions>

      {currentClient && currentClientMonth && (
        <ClientsStatsBoundary>
          <CurrentClientCard
            client={currentClient}
            monthStats={currentClientMonth}
            onOpen={openEdit}
          />
        </ClientsStatsBoundary>
      )}

      {allClients.length > 0 && (
        <ClientsStatsBoundary>
          <ClientsStats clients={allWithStats} workEntries={data.workEntries} />
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
            clients={listClients}
            workTypeFilter={workTypeFilter}
            onWorkTypeFilterChange={setWorkTypeFilter}
            currencyFilter={currencyFilter}
            onCurrencyFilterChange={setCurrencyFilter}
            activityFilter={activityFilter}
            onActivityFilterChange={setActivityFilter}
            sortKey={sortKey}
            onSortChange={setSort}
            activeFilterCount={activeFilterCount}
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
        client={historyClient}
        open={Boolean(historyClient)}
        onClose={() => setHistoryClient(null)}
      />
      <AppFooter />
    </PageContainer>
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
