import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

interface ShowcaseBlock {
  eyebrow: string
  title: string
  description: string
  bullets: string[]
  visual: React.ReactNode
  reverse?: boolean
}

const BLOCKS: ShowcaseBlock[] = [
  {
    eyebrow: 'Czas pracy',
    title: 'Mierz minuty, nie stresuj się zegarkiem',
    description:
      'Timer jednym kliknięciem, automatyczne grupowanie wpisów i pełna historia. Pracujesz offline? Wpisy synchronizują się po odzyskaniu połączenia.',
    bullets: [
      'Jednoklikowy start/stop z dowolnego widoku',
      'Ręczne wpisy z historią i tagami',
      'Widok dzienny, tygodniowy i kalendarzowy',
    ],
    visual: <TimerVisual />,
  },
  {
    eyebrow: 'Fakturowanie',
    title: 'Zamień godziny w fakturę — w 30 sekund',
    description:
      'Wybierz klienta, zakres dat i gotowe. WorkFlow Pro zsumuje wpisy, policzy stawki i wygeneruje fakturę PDF gotową do wysyłki.',
    bullets: [
      'Generator faktur PDF z własnym logo',
      'Numeracja, VAT, stawki i rabaty',
      'Eksport do księgowej jednym kliknięciem',
    ],
    visual: <InvoiceVisual />,
    reverse: true,
  },
  {
    eyebrow: 'Raporty',
    title: 'Podejmuj decyzje w oparciu o dane',
    description:
      'Dashboardy pokazują produktywność, rentowność klientów i projekty, które dają największy zwrot. Wszystko w czasie rzeczywistym.',
    bullets: [
      'Wykresy tygodniowe i miesięczne',
      'Ranking klientów wg przychodu',
      'Alerty o przekroczonym budżecie',
    ],
    visual: <ReportsVisual />,
  },
]

export function FeatureShowcase() {
  return (
    <section id="korzysci" className="border-b border-border bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        {BLOCKS.map((block) => (
          <ShowcaseRow key={block.title} block={block} />
        ))}
      </div>
    </section>
  )
}

function ShowcaseRow({ block }: { block: ShowcaseBlock }) {
  return (
    <div
      className={cn(
        'grid items-center gap-10 lg:grid-cols-2 lg:gap-16',
        block.reverse && 'lg:[&>div:first-child]:order-2',
      )}
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {block.eyebrow}
        </p>
        <h3 className="mt-3 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          {block.title}
        </h3>
        <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
          {block.description}
        </p>
        <ul className="mt-6 space-y-3">
          {block.bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Check className="size-3" aria-hidden="true" />
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div aria-hidden="true">{block.visual}</div>
    </div>
  )
}

function TimerVisual() {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Aktualny wpis
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
          <span className="size-1.5 animate-pulse rounded-full bg-success" />
          LIVE
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold">Landing page — rewizja V2</p>
      <p className="mt-1 text-xs text-muted-foreground">Klient: Acme Sp. z o.o.</p>
      <div className="mt-6 font-mono text-5xl font-semibold tabular-nums tracking-tight">
        01:23:47
      </div>
      <div className="mt-6 space-y-2">
        {[
          { name: 'Spotkanie kickoff', time: '45:12' },
          { name: 'Research konkurencji', time: '1:12:03' },
          { name: 'Wireframes', time: '2:47:21' },
        ].map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-xs"
          >
            <span className="truncate font-medium">{item.name}</span>
            <span className="font-mono tabular-nums text-muted-foreground">
              {item.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function InvoiceVisual() {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/5">
      <div className="flex items-start justify-between border-b border-border pb-4">
        <div>
          <p className="text-lg font-semibold">Faktura FV/04/2025</p>
          <p className="text-xs text-muted-foreground">Termin płatności: 7 dni</p>
        </div>
        <span className="rounded-md bg-warning/15 px-2.5 py-1 text-xs font-semibold text-warning-foreground">
          Do wysyłki
        </span>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        {[
          { label: 'Projektowanie UI', value: '3 200,00 zł' },
          { label: 'Spotkania + konsultacje', value: '960,00 zł' },
          { label: 'Rewizje graficzne', value: '480,00 zł' },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-mono tabular-nums">{row.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm font-semibold">Do zapłaty</span>
        <span className="font-mono text-2xl font-semibold tabular-nums">4 640,00 zł</span>
      </div>
    </div>
  )
}

function ReportsVisual() {
  const bars = [40, 62, 55, 78, 48, 90, 72]
  return (
    <div className="relative rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Produktywność — ostatnie 7 dni</p>
        <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
          +18%
        </span>
      </div>
      <div className="mt-6 flex h-40 items-end gap-3">
        {bars.map((h, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-primary/40 to-primary"
              style={{ height: `${h}%` }}
            />
            <span className="text-[10px] font-medium text-muted-foreground">
              {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'][i]}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-4">
        {[
          { k: 'Suma', v: '34,2h' },
          { k: 'Śr./dzień', v: '4,9h' },
          { k: 'Przychód', v: '6 840 zł' },
        ].map((s) => (
          <div key={s.k}>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {s.k}
            </p>
            <p className="mt-1 font-mono text-base font-semibold tabular-nums">
              {s.v}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
