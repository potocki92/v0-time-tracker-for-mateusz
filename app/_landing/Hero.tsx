import Link from 'next/link'
import { ArrowRight, CheckCircle2, Play } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface HeroProps {
  isAuthenticated: boolean
}

const USP = [
  'Darmowy plan startowy',
  'Bez karty kredytowej',
  'Pełna zgodność z RODO',
] as const

export function Hero({ isAuthenticated }: HeroProps) {
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
            WorkFlow Pro to kompletny system dla freelancerów i małych zespołów.
            Mierz godziny, zarządzaj klientami, generuj profesjonalne faktury PDF
            i rozliczaj projekty — bez papierkowej roboty.
          </p>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {USP.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-foreground/85">
                <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            {isAuthenticated ? (
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link href="/dashboard">
                  Przejdź do panelu
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="h-12 px-6 text-base">
                  <Link href="/auth/sign-up">
                    Rozpocznij za darmo
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base">
                  <a href="#jak-dziala">
                    <Play className="size-4" />
                    Zobacz jak to działa
                  </a>
                </Button>
              </>
            )}
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

function HeroVisual() {
  return (
    <div className="relative" aria-hidden="true">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/15 via-transparent to-chart-2/10 blur-2xl" />
      <div className="rounded-2xl border border-border bg-card p-3 shadow-2xl shadow-primary/5">
        <div className="flex items-center gap-1.5 px-2 py-1.5">
          <span className="size-2.5 rounded-full bg-destructive/70" />
          <span className="size-2.5 rounded-full bg-warning/80" />
          <span className="size-2.5 rounded-full bg-success/80" />
          <span className="ml-3 text-[11px] font-medium text-muted-foreground">
            workflow-pro.app/dashboard
          </span>
        </div>

        <div className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Aktywny projekt
              </p>
              <p className="mt-1 text-sm font-semibold">Redesign strony — Acme</p>
            </div>
            <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              ● Śledzenie
            </div>
          </div>

          <div className="mt-5 flex items-baseline gap-2">
            <span className="font-mono text-4xl font-semibold tabular-nums tracking-tight">
              02:47:18
            </span>
            <span className="text-xs text-muted-foreground">dzisiaj</span>
          </div>

          <div className="mt-6 space-y-3">
            {[
              { label: 'Projektowanie UI', value: 68, time: '4h 12min' },
              { label: 'Spotkania', value: 32, time: '1h 56min' },
              { label: 'Development', value: 54, time: '3h 18min' },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{row.label}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {row.time}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${row.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5">
            {[
              { label: 'Tydzień', value: '34.2h' },
              { label: 'Do faktury', value: '2 840 zł' },
              { label: 'Klienci', value: '12' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border bg-card p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-1 font-mono text-base font-semibold tabular-nums">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
