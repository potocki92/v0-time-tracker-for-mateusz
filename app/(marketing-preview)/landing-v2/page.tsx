import type { Metadata } from 'next'

import { buildMetadata } from '@/lib/seo/metadata'

import { buildDemoMonth } from './_demo/demo-month.server'
import { AutomationShowcase } from './_sections/AutomationShowcase'
import { EverythingElse } from './_sections/EverythingElse'
import { FinalCta } from './_sections/FinalCta'
import { FooterV2 } from './_sections/FooterV2'
import { HeroScene } from './_sections/HeroScene'
import { NavbarV2 } from './_sections/NavbarV2'
import { NumbersStory } from './_sections/NumbersStory'
import { ProductJourney } from './_sections/ProductJourney'

/**
 * `noindex`: to wersja testowa stojaca obok produkcyjnego `/`. Bez tego dwie
 * strony o tej samej tresci konkurowalyby ze soba w wynikach wyszukiwania.
 * Przy ewentualnej migracji na `/` flaga znika razem z cala grupa tras.
 */
export const metadata: Metadata = buildMetadata({
  path: '/landing-v2',
  title: 'TimeTracker — Landing V2 (preview)',
  description:
    'Preview of the new TimeTracker landing page: scroll through the real product — dashboard, calendar, projects, invoices, reports and work automation.',
  noindex: true,
})

/**
 * Strona jest Server Component i NIE czyta sesji ani Supabase — podglad ma
 * dzialac bez logowania. Jedyna praca serwera to policzenie miesiaca
 * demonstracyjnego prawdziwym automatem aplikacji (`buildDemoMonth`);
 * wynik jedzie do sekcji jako zwykle propsy, wiec bundle kliencki nie
 * dostaje ani domeny automatu, ani zoda.
 */
export default function LandingV2Page() {
  const month = buildDemoMonth()

  return (
    <>
      <NavbarV2 />

      <main id="main-content" tabIndex={-1} className="relative focus:outline-none">
        <HeroScene month={month} />
        <ProductJourney month={month} />
        <NumbersStory month={month} />
        <AutomationShowcase month={month} />
        <EverythingElse />
        <FinalCta />
      </main>

      <FooterV2 />
    </>
  )
}
