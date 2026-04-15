// _hooks/useWorkEntriesInfinite.ts
import { useInfiniteQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { QUERY_KEYS } from '@/lib/query/queryKeys'

const PAGE_SIZE = 50

export function useWorkEntriesInfinite(userId: string) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.workEntries(), 'infinite'],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const supabase = createClient()
      const from = pageParam * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, error } = await supabase
        .from('work_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .range(from, to)
      if (error) throw error
      return { items: data ?? [], nextPage: data?.length === PAGE_SIZE ? pageParam + 1 : undefined }
    },
    getNextPageParam: (last) => last.nextPage,
    enabled: Boolean(userId),
  })
}
