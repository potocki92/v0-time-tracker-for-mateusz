import { CASHFLOW_BARS, CASHFLOW_MONTHS } from '../data'

const KPIS = [
  { label: 'Tracked', value: '163.2h' },
  { label: 'Billable', value: '€5,563', em: true },
  { label: 'Outstanding', value: '€2,436' },
]

export function ScreenDashboard() {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold" style={{ color: 'var(--ink-1)' }}>
          Dashboard · April
        </div>
        <span className="chip-emerald flex items-center gap-1.5 text-2xs">
          <span
            className="live-dot"
            style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22E07A' }}
          />
          Live
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="panel">
            <div className="stat-label text-2xs">{kpi.label}</div>
            <div className={`num mt-1 text-base ${kpi.em ? 'em-text' : ''}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="panel flex-1">
        <div className="stat-label mb-3 text-2xs">Cashflow · 6 mo</div>
        <div className="flex h-[56px] items-end gap-1.5">
          {CASHFLOW_BARS.map((h, i) => (
            <div
              key={i}
              className={`flex-1 ${i === CASHFLOW_BARS.length - 1 ? 'bar now' : 'bar'}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="mt-1.5 flex gap-1.5">
          {CASHFLOW_MONTHS.map((m) => (
            <div key={m} className="flex-1 text-center text-2xs" style={{ color: 'var(--ink-3)' }}>
              {m}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
