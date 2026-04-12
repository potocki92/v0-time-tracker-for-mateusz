/**
 * Konfiguracja cache per zasób.
 * Osobny plik — queryKeys nie powinny wiedzieć o czasie cache.
 */

const MINUTE = 1_000 * 60

export const QUERY_CONFIG = {
  dashboard: {
    staleTime:            MINUTE * 5,
    gcTime:               MINUTE * 30,
    retry:                1,
    refetchOnWindowFocus: false,
  },
  invoices: {
    /** Faktury bardziej wrażliwe na zmiany — krótszy staleTime */
    staleTime:            MINUTE * 2,
    gcTime:               MINUTE * 15,
    retry:                1,
    refetchOnWindowFocus: false,
  },
  workEntries: {
    staleTime:            MINUTE * 5,
    gcTime:               MINUTE * 30,
    retry:                1,
    refetchOnWindowFocus: false,
  },
  clients: {
    /** Klienci zmieniają się rzadko */
    staleTime:            MINUTE * 15,
    gcTime:               MINUTE * 60,
    retry:                1,
    refetchOnWindowFocus: false,
  },
  eurRate: {
    /** Kurs EUR — odświeżaj co godzinę */
    staleTime:            MINUTE * 60,
    gcTime:               MINUTE * 120,
    retry:                2,
    refetchOnWindowFocus: false,
  },
} as const

export type QueryConfigKey = keyof typeof QUERY_CONFIG