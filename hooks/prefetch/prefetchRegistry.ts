import type { QueryKey } from '@tanstack/react-query'
import { QUERY_CONFIG, QUERY_KEYS, fetchJson } from '@/lib/query'

interface PrefetchEntry {
  queryKey: QueryKey
  staleTime: number
  /**
   * Odczyt idzie przez route handler GET, nie przez Server Action.
   *
   * To reguła calego repo, pilnowana przez navigation-perf.test.ts: Server
   * Action jest serializowana i doklada re-render RSC calej biezacej trasy do
   * kazdego odczytu. Przy prefetchu na hover bylo by to szczegolnie kosztowne —
   * placi za to strona, na ktorej user wlasnie stoi, a nie ta, do ktorej idzie.
   *
   * Efekt uboczny jest taki, ze rejestr nie potrzebuje leniwego ladowania
   * modulow: `fetchJson` + string z adresem to wszystko, co trafia do bundla
   * sidebara. Grafy danych sekcji zostaja tam, gdzie byly — za `/api/*`.
   */
  queryFn: () => Promise<unknown>
}

/**
 * Trasy, ktore warto pobrac na zamiar nawigacji.
 *
 * Klucze i staleTime MUSZA byc identyczne z tymi w hookach sekcji
 * (features/<x>/hooks/use<X>Data.ts) — inaczej prefetch wypelni inny wpis
 * cache niz ten, ktorego strona docelowa uzyje, i zaplacimy zapytanie dwa razy.
 *
 * Czego tu nie ma i dlaczego:
 *  • `/reports` — nie ma osobnej akcji pobierajacej, dzieli klucz z dashboardem.
 *  • `/invoices` — nie ma `app/api/invoices/route.ts`. Jedyna sciezka odczytu to
 *    `getInvoicesDataServer`, czyli Server Action z modulu prywatnego sekcji.
 *    Wpis lamalby oba niezmienniki opisane wyzej. Odblokowuje to dopiero wlasny
 *    route handler — to osobna zmiana, nie ta.
 */
export const PREFETCH_REGISTRY: Readonly<Record<string, PrefetchEntry>> = {
  '/dashboard': {
    queryKey: QUERY_KEYS.dashboard(),
    staleTime: QUERY_CONFIG.dashboard.staleTime,
    queryFn: () => fetchJson('/api/dashboard'),
  },
  '/calendar': {
    queryKey: QUERY_KEYS.calendar(),
    staleTime: QUERY_CONFIG.calendar.staleTime,
    queryFn: () => fetchJson('/api/calendar'),
  },
  '/clients': {
    queryKey: QUERY_KEYS.clientsData(),
    staleTime: QUERY_CONFIG.clients.staleTime,
    queryFn: () => fetchJson('/api/clients'),
  },
  '/projects': {
    queryKey: QUERY_KEYS.projectsData(),
    staleTime: QUERY_CONFIG.projects.staleTime,
    queryFn: () => fetchJson('/api/projects'),
  },
} as const
