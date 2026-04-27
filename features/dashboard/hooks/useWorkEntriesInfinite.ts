import { useInfiniteQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/query/queryKeys'
import { fetchWorkEntriesPage } from '../services/dashboard.fetchers'

const PAGE_SIZE = 50

export function useWorkEntriesInfinite(userId: string) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.workEntries(), 'infinite', userId],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchWorkEntriesPage(userId, pageParam, PAGE_SIZE),
    getNextPageParam: (last) => last.nextPage,
    enabled: Boolean(userId),
  })
}
