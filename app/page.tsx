import type { Metadata } from 'next'

import { createClient } from '@/lib/supabase/server'
import { buildMetadata } from '@/lib/seo/metadata'

import {
  LandingNavbarSection,
  HeroSection,
  StatsStripSection,
  FeaturesSection,
  FeatureShowcaseSection,
  HowItWorksSection,
  TestimonialSection,
  FaqSection,
  FinalCtaSection,
  FooterSection,
} from './_landing/components'

export const metadata: Metadata = buildMetadata({
  path: '/',
  title:
    'WorkFlow Pro — rejestr czasu pracy, faktury i rozliczenia dla freelancerów',
  description:
    'Mierz czas pracy, zarządzaj klientami i wystawiaj faktury w jednym miejscu. Darmowy start, bez karty kredytowej, w pełni zgodne z RODO.',
})

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isAuthenticated = Boolean(user)

  return (
    <>
      <LandingNavbarSection isAuthenticated={isAuthenticated} />
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <HeroSection isAuthenticated={isAuthenticated} />
        <StatsStripSection />
        <FeaturesSection />
        <FeatureShowcaseSection />
        <HowItWorksSection />
        <TestimonialSection />
        <FaqSection />
        <FinalCtaSection isAuthenticated={isAuthenticated} />
      </main>
      <FooterSection />
    </>
  )
}
