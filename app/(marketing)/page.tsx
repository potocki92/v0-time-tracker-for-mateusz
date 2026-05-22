import type { Metadata } from 'next'

import { createClient } from '@/lib/supabase/server'
import { buildMetadata } from '@/lib/seo/metadata'

import {
  LandingNavbarSection,
  HeroSection,
  StatsStripSection,
  IconicMarkSection,
  BigNumbersSection,
  FeatureShowcaseSection,
  FeaturesSection,
  HowItWorksSection,
  TestimonialSection,
  PricingSection,
  FaqSection,
  FinalCtaSection,
  FooterSection,
} from './_landing/components'

export const metadata: Metadata = buildMetadata({
  path: '/',
  title: 'TimeTracker — Time, accounted for.',
  description:
    'The clock for independent work. Track every hour, build invoices from the timesheet, and get paid — without the spreadsheet.',
})

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isAuthenticated = Boolean(user)

  return (
    <>
      <div className="mesh" aria-hidden="true" />
      <LandingNavbarSection isAuthenticated={isAuthenticated} />
      <main id="main-content" tabIndex={-1} className="focus:outline-none relative z-10">
        <HeroSection />
        <StatsStripSection />
        <IconicMarkSection />
        <BigNumbersSection />
        <FeatureShowcaseSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialSection />
        <PricingSection />
        <FaqSection />
        <FinalCtaSection isAuthenticated={isAuthenticated} />
      </main>
      <FooterSection />
    </>
  )
}
