import { FinalCtaActions } from './FinalCtaActions'

interface FinalCtaSectionProps {
  isAuthenticated: boolean
}

export function FinalCtaSection({ isAuthenticated }: FinalCtaSectionProps) {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-10 text-center sm:p-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 left-1/2 h-60 w-[120%] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
          />
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Zacznij mierzyć czas, który faktycznie się opłaca
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            Załóż darmowe konto i wystaw pierwszą fakturę jeszcze dzisiaj. Bez zobowiązań, bez
            karty kredytowej.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <FinalCtaActions isAuthenticated={isAuthenticated} />
          </div>
        </div>
      </div>
    </section>
  )
}
