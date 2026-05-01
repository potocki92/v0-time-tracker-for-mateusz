import type { ComponentType } from 'react'
import { LineChart, Download, CalendarRange, Filter, TrendingUp } from 'lucide-react'

const KPI_ITEMS = [
  { label: 'Łączny czas', value: '124h' },
  { label: 'Średnio / dzień', value: '6.2h' },
  { label: 'Billable', value: '78%' },
  { label: 'Nadgodziny', value: '+12h' },
]

const INSIGHTS = [
  'Najwięcej czasu: Hans-Böckler-Str. 284 (34%)',
  'Wzrost billable o 8% vs poprzedni okres',
  '2 dni bez wpisów w ostatnich 14 dniach',
]

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-4 px-3 pb-24 pt-3 sm:px-4 md:grid-cols-[300px_minmax(0,1fr)] md:px-6 lg:px-8">
        <aside className="rounded-xl border border-white/10 bg-zinc-950/90 p-3 md:sticky md:top-4 md:h-fit">
          <div className="mb-4 border-b border-white/10 pb-3">
            <p className="text-xs uppercase tracking-[0.08em] text-zinc-400">Statystyki</p>
            <h1 className="mt-1 text-lg font-semibold">Raporty</h1>
            <p className="text-xs text-zinc-500">01.05.2026 – 31.05.2026</p>
          </div>

          <div className="space-y-2">
            <SidebarButton icon={CalendarRange} label="Zakres: ostatnie 30 dni" />
            <SidebarButton icon={Filter} label="Filtry: projekt, klient, tag" />
            <SidebarButton icon={TrendingUp} label="Porównaj z poprzednim okresem" />
            <SidebarButton icon={Download} label="Eksportuj PDF / CSV" />
          </div>

          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            <p className="text-xs uppercase tracking-[0.08em] text-zinc-500">Szybkie insighty</p>
            {INSIGHTS.map((item) => (
              <div key={item} className="rounded-md border border-white/10 bg-zinc-900/70 p-2 text-xs text-zinc-300">
                {item}
              </div>
            ))}
          </div>
        </aside>

        <main className="space-y-4">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {KPI_ITEMS.map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-white/10 bg-zinc-950/80 p-4">
                <p className="text-xs text-zinc-400">{kpi.label}</p>
                <p className="mt-2 text-2xl font-semibold">{kpi.value}</p>
              </div>
            ))}
          </section>

          <section className="rounded-xl border border-white/10 bg-zinc-950/80 p-4">
            <div className="mb-3 flex items-center gap-2 text-zinc-300">
              <LineChart className="size-4" />
              <h2 className="text-sm font-medium">Rozkład czasu per projekt</h2>
            </div>
            <div className="space-y-2">
              <Bar label="Hans-Böckler-Str. 284" value={34} />
              <Bar label="Im Winkel 51" value={27} />
              <Bar label="Gustavsburger 25–35" value={19} />
              <Bar label="Administracja" value={20} />
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

function SidebarButton({ icon: Icon, label }: { icon: ComponentType<{ className?: string }>; label: string }) {
  return (
    <button className="flex w-full items-center gap-2 rounded-md border border-white/10 bg-zinc-900/60 px-2.5 py-2 text-left text-xs text-zinc-300 transition hover:bg-zinc-800/70">
      <Icon className="size-3.5 text-zinc-500" />
      <span>{label}</span>
    </button>
  )
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800">
        <div className="h-2 rounded-full bg-zinc-300" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
