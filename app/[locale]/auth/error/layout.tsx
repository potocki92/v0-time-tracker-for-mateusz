import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { toAppLocale } from '@/i18n/config'
import { buildLocalizedMetadata } from '@/lib/seo/metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const appLocale = toAppLocale(locale)
  const t = await getTranslations({ locale: appLocale, namespace: 'auth' })

  return buildLocalizedMetadata({
    locale: appLocale,
    path: '/auth/error',
    noindex: true,
    title: t('error.metaTitle'),
    description: t('error.metaDescription'),
  })
}

export default function AuthSubLayout({ children }: { children: React.ReactNode }) {
  return children
}
