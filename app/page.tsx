import type { Metadata } from 'next'

import { createClient } from '@/lib/supabase/server'
import { buildMetadata } from '@/lib/seo/metadata'

import { LandingNavbar } from './_landing/LandingNavbar'
import { Hero } from './_landing/Hero'
import { StatsStrip } from './_landing/StatsStrip'
import { Features } from './_landing/Features'
import { FeatureShowcase } from './_landing/FeatureShowcase'
import { HowItWorks } from './_landing/HowItWorks'
import { Testimonial } from './_landing/Testimonial'
import { Faq } from './_landing/Faq'
import { FinalCta } from './_landing/FinalCta'
import { Footer } from './_landing/Footer'

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
      <LandingNavbar isAuthenticated={isAuthenticated} />
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <Hero isAuthenticated={isAuthenticated} />
        <StatsStrip />
        <Features />
        <FeatureShowcase />
        <HowItWorks />
        <Testimonial />
        <Faq />
        <FinalCta isAuthenticated={isAuthenticated} />
      </main>
      <Footer />
    </>
  )
}
