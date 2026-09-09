import { Play } from 'lucide-react'

import { formatHours, formatMoney, toMinor } from '@/lib/format'

import {
  DEMO_INVOICES,
  DEMO_PROJECTS,
  DEMO_RATE_EUR,
  DEMO_WEEK,
  DEMO_WEEKDAY_SHORT,
  demoClient,
  type DemoMonth,
} from '../../_demo/demo-data'
import { Bars, Card, Dot, Eyebrow, Meter, Pill, StatTile } from '../ui'

/**
 * Pulpit — replika `features/dashboard`: kafle KPI, wykres zarobkow z
 * przelacznikiem zakresu, karta „Dzisiaj" z akcja glowna, lista projektow
 * i stan faktur. Te same sekcje, ta sama kolejnosc, te same etykiety.
 */
export function DashboardScreen({ month }: { month: DemoMonth }) {
  const weekEarnings = DEMO_WEEK.hours * DEMO_RATE_EUR

  return (
    <div className="flex h-full flex-col gap-2">
      <p className="lv2-t9 uppercase tracking-[0.14em] text-zinc-400">
        Wtorek · 08 wrz 2026 · KW 37/2026
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile
          label="Godziny"
          value={formatHours(DEMO_WEEK.hours)}
          meta={`Cel ${formatHours(DEMO_WEEK.hours)} · seria 6 dni`}
        />
        <StatTile
          label="Zarobki"
          value={formatMoney(toMinor(weekEarnings), 'EUR')}
          meta="Ten tydzień"
          accent
        />
        {/* Ponizej `sm` ramka ma polowe wysokosci: lepiej pokazac dwa kafle
            w pelnym rozmiarze niz cztery przyciete. */}
        <StatTile
          className="hidden sm:block"
          label="Stawka efektywna"
          value={formatMoney(toMinor(DEMO_RATE_EUR), 'EUR')}
          meta="za godzinę"
        />
        <StatTile className="hidden sm:block" label="Faktury" value="3" meta="1 szkic · 2 wysłane" />
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between">
          <Eyebrow>Zarobki</Eyebrow>
          <div className="flex gap-0.5 rounded-md border border-[var(--lv2-hair-2)] p-0.5">
            {['Tydzień', 'Miesiąc', 'Rok'].map((range, index) => (
              <span
                key={range}
                className={`rounded px-1.5 py-0.5 lv2-t8 ${
                  index === 0 ? 'bg-white/10 text-white' : 'text-zinc-400'
                }`}
              >
                {range}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-1 text-lg font-semibold leading-none tabular-nums text-white">
          {formatMoney(toMinor(weekEarnings), 'EUR')}
        </p>
        <p className="lv2-t9 text-zinc-400">{DEMO_WEEK.label}</p>
        <Bars
          className="mt-2 max-h-[150px] min-h-[52px] flex-1"
          values={DEMO_WEEK.daily}
          labels={DEMO_WEEKDAY_SHORT}
          activeIndex={1}
        />
      </Card>

      {/* Na waskim ekranie ramka ma polowe wysokosci — zamiast sciskac oba
          bloki do nieczytelnosci, zostaje ten jeden. */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
        <Card>
          <Eyebrow>Aktualne projekty</Eyebrow>
          <ul className="mt-2 space-y-2">
            {DEMO_PROJECTS.map((project) => (
              <li key={project.id} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Dot color={demoClient(project.clientId).color} />
                  <span className="min-w-0 flex-1 truncate lv2-t10 text-zinc-200">
                    {project.name}
                  </span>
                  <span className="lv2-mono lv2-t9 tabular-nums text-zinc-400">
                    {formatHours(project.hours)}
                  </span>
                </div>
                <Meter
                  value={project.budgetUtilization}
                  tone={project.status === 'in_progress' ? 'accent' : 'neutral'}
                />
              </li>
            ))}
          </ul>
        </Card>

        <Card className="hidden sm:block">
          <div className="flex items-center justify-between">
            <Eyebrow>Faktury</Eyebrow>
            <span className="lv2-t9 tabular-nums text-zinc-400">
              {formatMoney(toMinor(month.earningsEur), 'EUR')} do wystawienia
            </span>
          </div>
          <ul className="mt-2 space-y-1.5">
            {DEMO_INVOICES.map((invoice) => (
              <li key={invoice.number} className="flex items-center gap-2">
                <span className="lv2-mono lv2-t9 text-zinc-300">{invoice.number}</span>
                <Pill tone={invoice.status === 'Opłacona' ? 'accent' : 'mute'}>{invoice.status}</Pill>
                <span className="lv2-mono ml-auto lv2-t9 tabular-nums text-zinc-200">
                  {formatMoney(toMinor(invoice.amountEur), 'EUR')}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2.5 flex items-center gap-1.5 border-t border-[var(--lv2-hair)] pt-2.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--lv2-accent)] px-2 py-1 lv2-t9 font-semibold text-black">
              Dodaj dziś: {formatHours(10)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-[var(--lv2-hair-2)] px-2 py-1 lv2-t9 text-zinc-300">
              <Play className="size-2 fill-current" />
              Uruchom timer
            </span>
          </div>
        </Card>
      </div>
    </div>
  )
}
