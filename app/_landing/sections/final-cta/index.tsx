import { MotionReveal } from '@/app/_landing/ui/MotionReveal'
import { ParallaxLayer } from '@/app/_landing/ui/ParallaxLayer'

import { FinalCtaActions } from './FinalCtaActions'

interface FinalCtaSectionProps {
  isAuthenticated: boolean
}

export function FinalCtaSection({ isAuthenticated }: FinalCtaSectionProps) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <ParallaxLayer
        offset={80}
        className="pointer-events-none absolute left-1/2 top-12 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      >
        <div />
      </ParallaxLayer>

      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <MotionReveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-gradient-to-br from-primary/15 via-card to-card p-10 text-center shadow-2xl shadow-primary/10 sm:p-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 left-1/2 h-60 w-[120%] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(120deg,transparent,theme(colors.primary/8),transparent)]"
            />

            <div className="relative">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                Gotowy na mniej chaosu?
              </p>
              <h2 className="mx-auto mt-3 max-w-3xl text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
                Zacznij mierzyć czas, który faktycznie się opłaca
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
                Załóż darmowe konto i wystaw pierwszą fakturę jeszcze dzisiaj. Bez zobowiązań,
                bez karty kredytowej.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <FinalCtaActions isAuthenticated={isAuthenticated} />
              </div>
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  )
}
