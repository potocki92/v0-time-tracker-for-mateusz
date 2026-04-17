/**
 * Konfiguracja cache per zasób.
 * Osobny plik — queryKeys nie powinny wiedzieć o czasie cache.
 */

const MINUTE = 1_000 * 60

export const QUERY_CONFIG = {
  dashboard: {
    staleTime: MINUTE * 5,
    gcTime:    MINUTE * 30,
    retry:     1,
    refetchOnWindowFocus: 'always' as const, // dane finansowe — zawsze świeże
  },
  calendar: {
    staleTime: MINUTE * 5,
    gcTime:    MINUTE * 30,
    retry:     1,
    refetchOnWindowFocus: 'always' as const,
  },
  invoices: {
    staleTime: MINUTE * 2,
    gcTime:    MINUTE * 15,
    retry:     1,
    refetchOnWindowFocus: 'always' as const,
  },
  workEntries: {
    staleTime: MINUTE * 5,
    gcTime:    MINUTE * 30,
    retry:     1,
    refetchOnWindowFocus: 'always' as const,
  },
  clients: {
    staleTime: MINUTE * 15,
    gcTime:    MINUTE * 60,
    retry:     1,
    refetchOnWindowFocus: false, // klienci się rzadko zmieniają
  },
  eurRate: {
    staleTime: MINUTE * 60,
    gcTime:    MINUTE * 120,
    retry:     2,
    retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30_000),
    refetchOnWindowFocus: false,
  },
} as const

export type QueryConfigKey = keyof typeof QUERY_CONFIG