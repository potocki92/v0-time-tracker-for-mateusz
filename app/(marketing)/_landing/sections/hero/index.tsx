import { CheckCircle2, Sparkles } from 'lucide-react'

import { MotionReveal } from '@/app/(marketing)/_landing/ui/MotionReveal'
import { ParallaxLayer } from '@/app/(marketing)/_landing/ui/ParallaxLayer'

import { HERO_USP_ITEMS } from './data'
import { HeroActions } from './HeroActions'
import { HeroVisual } from './HeroVisual'

interface HeroSectionProps {
  isAuthenticated: boolean
}

export function HeroSection({ isAuthenticated }: HeroSectionProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_20%,theme(colors.primary/18),transparent_32%),radial-gradient(circle_at_85%_10%,theme(colors.chart-2/18),transparent_30%),linear-gradient(to_bottom,theme(colors.background),theme(colors.muted/30),theme(colors.background))]"
      />
      <ParallaxLayer
        offset={120}
        className="pointer-events-none absolute left-1/2 top-12 -z-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      >
        <div />
      </ParallaxLayer>
      <ParallaxLayer
        offset={-80}
        className="pointer-events-none absolute right-[-120px] top-36 -z-10 h-72 w-72 rounded-full bg-chart-2/15 blur-3xl"
      >
        <div />
      </ParallaxLayer>

      <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:px-8 lg:py-24">
        <div className="flex flex-col">
          <MotionReveal>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-background/70 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
              <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
              Nowoczesny time tracker dla freelancerów i małych zespołów
            </span>
          </MotionReveal>

          <MotionReveal delay={0.08}>
            <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Zamień czas pracy w{' '}
              <span className="bg-gradient-to-r from-primary via-chart-2 to-primary bg-clip-text text-transparent">
                przewidywalny przychód
              </span>
            </h1>
          </MotionReveal>

          <MotionReveal delay={0.16}>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-xl">
              WorkFlow Pro porządkuje cały proces: od startu timera, przez projekty i klientów,
              aż po profesjonalne faktury PDF. Mniej administracji, więcej płatnej pracy.
            </p>
          </MotionReveal>

          <MotionReveal delay={0.24}>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {HERO_USP_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground/85">
                  <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </MotionReveal>

          <MotionReveal delay={0.32}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <HeroActions isAuthenticated={isAuthenticated} />
            </div>
          </MotionReveal>

          <MotionReveal delay={0.4}>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {[
                ['34,2h', 'zarejestrowane w tygodniu'],
                ['2 840 zł', 'gotowe do faktury'],
                ['12', 'aktywnych klientów'],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border/70 bg-background/60 p-4 shadow-sm backdrop-blur"
                >
                  <p className="font-mono text-xl font-semibold tabular-nums">{value}</p>
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </MotionReveal>
        </div>

        <MotionReveal delay={0.18} y={32}>
          <ParallaxLayer offset={-70}>
            <HeroVisual />
          </ParallaxLayer>
        </MotionReveal>
      </div>
    </section>
  )
}
