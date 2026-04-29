import { MotionItem, MotionReveal, MotionStagger } from '@/app/(marketing)/_landing/ui/MotionReveal'
import { SectionIntro } from '@/app/(marketing)/_landing/ui/SectionIntro'

import { FeatureCard } from './FeatureCard'
import { FEATURE_ITEMS } from './data'

export function FeaturesSection() {
  return (
    <section id="funkcje" className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,theme(colors.primary/10),transparent_65%)]"
      />

      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <MotionReveal>
          <SectionIntro
            eyebrow="Funkcje"
            title="Cały workflow rozliczania pracy w jednym panelu"
            description="Od pierwszej minuty pracy do faktury PDF. WorkFlow Pro łączy timer, projekty, klientów, kalendarz i raporty w jeden spójny system."
          />
        </MotionReveal>

        <MotionStagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_ITEMS.map((feature) => (
            <MotionItem key={feature.title}>
              <FeatureCard {...feature} />
            </MotionItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  )
}
