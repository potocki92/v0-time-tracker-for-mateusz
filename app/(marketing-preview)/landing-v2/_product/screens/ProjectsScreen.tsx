import { formatHours, formatMoney, formatPercent, toMinor } from '@/lib/format'

import { DEMO_CLIENTS, DEMO_PROJECTS, demoClient } from '../../_demo/demo-data'
import { Card, Dot, Eyebrow, Meter, Pill, StatTile } from '../ui'

/**
 * Projekty + Klienci — replika `features/projects` (wiersz z szyna statusu,
 * godziny, wykorzystanie budzetu, termin) i `features/clients` (tabela ze
 * stawka, typem rozliczenia i waluta).
 *
 * Dwa ekrany w jednej scenie, bo to jeden model danych: klient niesie
 * stawke, projekt niesie godziny.
 */
export function ProjectsScreen() {
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Wszystkie" value="3" meta="1 zaplanowany" />
        <StatTile label="W trakcie" value="1" meta="33% całości" accent />
        <StatTile label="Zakończone" value="1" meta="33% całości" />
        <StatTile label="Klienci" value="3" meta="2 godzinowi · 1 akordowy" />
      </div>

      <Card className="min-h-0 flex-1">
        <Eyebrow>Wszystkie projekty</Eyebrow>
        <ul className="mt-2 space-y-1.5">
          {DEMO_PROJECTS.map((project) => {
            const client = demoClient(project.clientId)
            const active = project.status === 'in_progress'
            return (
              <li
                key={project.id}
                className="relative overflow-hidden rounded-lg border border-[var(--lv2-hair-2)] bg-[var(--lv2-s3)] py-2 pl-3 pr-2"
              >
                <span
                  aria-hidden
                  className={`absolute inset-y-0 left-0 w-[3px] ${
                    active ? 'bg-[var(--lv2-accent)]' : 'bg-white/15'
                  }`}
                />
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate lv2-t10 font-medium text-white">
                    {project.name}
                  </span>
                  <Pill tone={active ? 'accent' : 'mute'}>{project.statusLabel}</Pill>
                </div>
                <div className="mt-1 flex items-center gap-2 lv2-t9 text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Dot color={client.color} />
                    {client.name}
                  </span>
                  <span className="lv2-mono tabular-nums">{formatHours(project.hours)}</span>
                  <span className="lv2-mono tabular-nums">
                    budżet {formatPercent(project.budgetUtilization / 100)}
                  </span>
                  <span className="ml-auto">{project.due}</span>
                </div>
                <div className="mt-1.5">
                  <Meter value={project.budgetUtilization} tone={active ? 'accent' : 'neutral'} />
                </div>
              </li>
            )
          })}
        </ul>
      </Card>

      <Card className="hidden sm:block">
        <Eyebrow>Klienci</Eyebrow>
        <table className="mt-2 w-full">
          <thead>
            <tr className="text-left lv2-t8 uppercase tracking-wide text-zinc-400">
              <th className="pb-1 font-medium">Nazwa</th>
              <th className="pb-1 font-medium">Rozliczenie</th>
              <th className="pb-1 text-right font-medium">Stawka</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--lv2-hair)]">
            {DEMO_CLIENTS.map((client) => (
              <tr key={client.id} className="lv2-t9 text-zinc-300">
                <td className="py-1.5">
                  <span className="flex items-center gap-1.5">
                    <Dot color={client.color} />
                    {client.name}
                  </span>
                </td>
                <td className="py-1.5 text-zinc-400">
                  {client.workType === 'hourly' ? 'Godzinowe' : 'Akordowe'}
                </td>
                <td className="lv2-mono py-1.5 text-right tabular-nums">
                  {formatMoney(toMinor(client.rate), 'EUR')} / {client.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
