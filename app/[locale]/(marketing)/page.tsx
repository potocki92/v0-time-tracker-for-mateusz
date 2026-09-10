import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { toAppLocale } from '@/i18n/config'
import { buildLocalizedMetadata } from '@/lib/seo/metadata'

import { buildDemoMonth } from './_landing/demo/demo-month.server'
import { AutomationShowcase } from './_landing/sections/AutomationShowcase'
import { EverythingElse } from './_landing/sections/EverythingElse'
import { FinalCta } from './_landing/sections/FinalCta'
import { Footer } from './_landing/sections/Footer'
import { HeroScene } from './_landing/sections/HeroScene'
import { Navbar } from './_landing/sections/Navbar'
import { NumbersStory } from './_landing/sections/NumbersStory'
import { ProductJourney } from './_landing/sections/ProductJourney'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const appLocale = toAppLocale(locale)
  const t = await getTranslations({ locale: appLocale, namespace: 'seo' })

  return buildLocalizedMetadata({
    locale: appLocale,
    path: '/',
    title: t('landing.title'),
    description: t('landing.description'),
  })
}

/**
 * Landing jest Server Component i NIE czyta sesji ani Supabase — strona ma
 * dzialac bez logowania i renderowac sie statycznie. Jedyna praca serwera to
 * policzenie miesiaca demonstracyjnego prawdziwym automatem aplikacji
 * (`buildDemoMonth`); wynik jedzie do sekcji jako zwykle propsy, wiec bundle
 * kliencki nie dostaje ani domeny automatu, ani zoda.
 */
export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // Bez tego strona wypadlaby ze statycznego renderowania — `useTranslations`
  // w sekcjach czytaloby jezyk dynamicznie z naglowkow requestu.
  setRequestLocale(locale)

  const month = buildDemoMonth()

  return (
    <>
      <Navbar />

      <main id="main-content" tabIndex={-1} className="relative focus:outline-none">
        <HeroScene month={month} />
        <ProductJourney month={month} />
        <NumbersStory month={month} />
        <AutomationShowcase month={month} />
        <EverythingElse />
        <FinalCta />
      </main>

      <Footer />
    </>
  )
}
