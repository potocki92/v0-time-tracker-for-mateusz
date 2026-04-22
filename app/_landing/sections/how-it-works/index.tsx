import { SectionIntro } from '@/app/_landing/ui/SectionIntro'

import { HOW_IT_WORKS_STEPS } from './data'
import { HowItWorksStep } from './HowItWorksStep'

export function HowItWorksSection() {
  return (
    <section id="jak-dziala" className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionIntro
          eyebrow="Jak to działa"
          title="Od rejestracji do pierwszej faktury — w 4 krokach"
        />

        <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <HowItWorksStep
              key={step.number}
              number={step.number}
              title={step.title}
              description={step.description}
              showConnector={index < HOW_IT_WORKS_STEPS.length - 1}
            />
          ))}
        </ol>
      </div>
    </section>
  )
}
