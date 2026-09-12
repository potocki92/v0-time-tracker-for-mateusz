import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { QUERY_CONFIG } from '@/lib/query'
import {
  StatementContent,
  StatementContentBoundary,
  StatementSkeleton,
} from '@/features/accounting'
import {
  accountingQueryOptions,
  getAccountingDatasetServer,
} from '@/features/accounting/server'
import { rangeOf, todayKey } from '@/features/accounting/domain'
import { toAppLocale } from '@/i18n/config'
import { buildLocalizedMetadata } from '@/lib/seo/metadata'
import { parseStatementFiltersFromSearchParams } from './searchParams'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const appLocale = toAppLocale(locale)
  const t = await getTranslations({ locale: appLocale, namespace: 'accounting' })

  // Trasa zagniezdzona nie jest sekcja panelu, wiec nie przechodzi przez
  // `workspaceMetadata` (ono zna tylko segmenty pierwszego poziomu).
  return buildLocalizedMetadata({
    locale: appLocale,
    path: '/reports/accounting',
    noindex: true,
    title: t('meta.title'),
    description: t('meta.description'),
  })
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

/**
 * Default export jest SYNCHRONICZNY celowo — `await` w default exporcie
 * wstrzymywalby caly payload RSC do czasu powrotu zapytan Supabase,
 * przez co `<Suspense>` ponizej nie mialby czego zawiesic.
 */
export default function AccountingStatementPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: SearchParams
}) {
  return (
    <StatementContentBoundary>
      <Suspense fallback={<StatementSkeleton />}>
        <StatementData params={params} searchParams={searchParams} />
      </Suspense>
    </StatementContentBoundary>
  )
}

/**
 * Prefetch trafia w DOKLADNIE ten klucz, ktory zlozy klient.
 *
 * Jezyk dokumentu nie wchodzi do klucza — zmienia etykiety w pliku, nie dane,
 * wiec przelaczenie go nie pobiera niczego drugi raz.
 */
async function StatementData({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: SearchParams
}) {
  const today = todayKey()
  const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams])
  const filters = parseStatementFiltersFromSearchParams(resolvedSearchParams, toAppLocale(locale))
  const range = rangeOf(filters, today)

  const queryClient = new QueryClient({
    defaultOptions: { queries: QUERY_CONFIG.accounting },
  })

  const options = accountingQueryOptions({ range, clientId: filters.clientId })

  await queryClient.prefetchQuery({
    queryKey: options.queryKey,
    queryFn: () => getAccountingDatasetServer({ range, clientId: filters.clientId }),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StatementContent today={today} />
    </HydrationBoundary>
  )
}
