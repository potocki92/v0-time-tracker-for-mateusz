import type { Metadata } from 'next'

import { buildMetadata } from '@/lib/seo/metadata'

import { buildDemoMonth } from './_landing/demo/demo-month.server'
import { AutomationShowcase } from './_landing/sections/AutomationShowcase'
import { EverythingElse } from './_landing/sections/EverythingElse'
import { FinalCta } from './_landing/sections/FinalCta'
import { Footer } from './_landing/sections/Footer'
import { HeroScene } from './_landing/sections/HeroScene'
import { Navbar } from './_landing/sections/Navbar'
import { NumbersStory } from './_landing/sections/NumbersStory'
import { ProductJourney } from './_landing/sections/ProductJourney'

export const metadata: Metadata = buildMetadata({
  path: '/',
  title: 'TimeTracker — Time, accounted for.',
  description:
    'Track every hour, turn the timesheet into an invoice and let the work automation fill the calendar for you — dashboard, projects, invoices and reports in one place.',
})

/**
 * Landing jest Server Component i NIE czyta sesji ani Supabase — strona ma
 * dzialac bez logowania i renderowac sie statycznie. Jedyna praca serwera to
 * policzenie miesiaca demonstracyjnego prawdziwym automatem aplikacji
 * (`buildDemoMonth`); wynik jedzie do sekcji jako zwykle propsy, wiec bundle
 * kliencki nie dostaje ani domeny automatu, ani zoda.
 */
export default function LandingPage() {
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
