/**
 * Konfiguracja cache per zasób.
 * Osobny plik — queryKeys nie powinny wiedzieć o czasie cache.
 */

const MINUTE = 1_000 * 60

const QUERY_PROFILES = {
  hot: {
    staleTime: MINUTE * 2,
    gcTime: MINUTE * 15,
    retry: 1,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },
  warm: {
    staleTime: MINUTE * 5,
    gcTime: MINUTE * 30,
    retry: 1,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },
  cold: {
    staleTime: MINUTE * 15,
    gcTime: MINUTE * 60,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
} as const

export const QUERY_CONFIG = {
  dashboard: {
    ...QUERY_PROFILES.warm,
    // Alt+Tab na PC to dziesiatki przelaczen dziennie, a queryFn dashboardu
    // to Server Action — kazda odpowiedz niesie przerenderowany payload RSC
    // calej trasy, nie sam JSON. Dane pracy nie zmieniaja sie z minuty na
    // minute, wiec staleTime 5 min + refetchOnReconnect wystarcza.
    //
    // Swiezosc po edycji w innej sekcji zapewnia inwalidacja z Etapu 3,
    // nie focus okna.
    //
    // Jesli read path przejdzie na route handler GET (plan wydajnosciowy),
    // ten wyjatek mozna cofnac — wtedy refetch kosztuje jeden JSON.
    refetchOnWindowFocus: false,
  },
  calendar: {
    ...QUERY_PROFILES.warm,
  },
  invoices: {
    ...QUERY_PROFILES.hot,
  },
  workEntries: {
    ...QUERY_PROFILES.warm,
  },
  clients: {
    ...QUERY_PROFILES.cold,
  },
  projects: {
    ...QUERY_PROFILES.warm,
  },
  eurRate: {
    staleTime: MINUTE * 60,
    gcTime: MINUTE * 120,
    retry: 2,
    retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30_000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  trips: {
    ...QUERY_PROFILES.cold,
  },
} as const

export const QUERY_CLIENT_DEFAULTS = {
  queries: {
    ...QUERY_PROFILES.warm,
  },
  mutations: {
    retry: 0,
  },
} as const

