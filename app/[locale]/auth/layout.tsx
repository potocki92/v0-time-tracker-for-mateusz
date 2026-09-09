import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'

import { toAppLocale } from '@/i18n/config'
import { loadMessages, pickMessages } from '@/i18n/messages'
import { buildLocalizedMetadata } from '@/lib/seo/metadata'

import { AuthShell } from './_components/AuthShell'

/**
 * Strefa auth nie powinna być indeksowana — to formularze stanowe,
 * bez wartości SEO, z potencjalnymi parametrami redirect/tokenami.
 * Dlatego `noindex` i brak `hreflang` (patrz `buildLocalizedMetadata`).
 */
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
    path: '/auth',
    noindex: true,
    title: t('meta.title'),
    description: t('meta.description'),
  })
}

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const appLocale = toAppLocale(locale)
  // Formularze auth potrzebuja trzech przestrzeni: copy, komunikatow
  // walidacji i kodow bledow. Nic ponadto nie jedzie do przegladarki.
  const messages = pickMessages(await loadMessages(appLocale), ['auth', 'validation', 'errors'])

  return (
    <NextIntlClientProvider locale={appLocale} messages={messages}>
      <AuthShell>{children}</AuthShell>
    </NextIntlClientProvider>
  )
}
