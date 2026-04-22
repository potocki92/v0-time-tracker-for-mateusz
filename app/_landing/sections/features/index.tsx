import { SectionIntro } from '@/app/_landing/ui/SectionIntro'

import { FeatureCard } from './FeatureCard'
import { FEATURE_ITEMS } from './data'

export function FeaturesSection() {
  return (
    <section id="funkcje" className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionIntro
          eyebrow="Funkcje"
          title="Wszystko czego potrzebujesz — w jednym panelu"
          description="Zamiast żonglować pięcioma aplikacjami, WorkFlow Pro łączy czas pracy, klientów, projekty i fakturowanie w spójny workflow."
        />

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_ITEMS.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </ul>
      </div>
    </section>
  )
}
