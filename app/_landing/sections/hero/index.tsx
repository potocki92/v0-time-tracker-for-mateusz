import { CheckCircle2 } from 'lucide-react'

import { HERO_USP_ITEMS } from './data'
import { HeroActions } from './HeroActions'
import { HeroVisual } from './HeroVisual'

interface HeroSectionProps {
  isAuthenticated: boolean
}

export function HeroSection({ isAuthenticated }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,theme(colors.primary/12),transparent_60%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-[linear-gradient(to_bottom,theme(colors.muted/40),transparent)]"
      />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
        <div className="flex flex-col">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-accent/60 px-3 py-1 text-xs font-medium text-accent-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Nowość — rozliczaj projekty 2× szybciej
          </span>

          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Rejestruj czas pracy i&nbsp;wystawiaj faktury{' '}
            <span className="text-primary">w&nbsp;jednym miejscu</span>
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            WorkFlow Pro to kompletny system dla freelancerów i małych zespołów. Mierz godziny,
            zarządzaj klientami, generuj profesjonalne faktury PDF i rozliczaj projekty — bez
            papierkowej roboty.
          </p>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {HERO_USP_ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-foreground/85">
                <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <HeroActions isAuthenticated={isAuthenticated} />
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Dołącz do freelancerów, którzy przestali się martwić o rozliczenia.
          </p>
        </div>

        <HeroVisual />
      </div>
    </section>
  )
}
