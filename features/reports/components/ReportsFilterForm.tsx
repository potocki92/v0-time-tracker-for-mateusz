'use client'

import type { Client, Project } from '@/lib/types'
import type { PeriodPreset, ReportsFilters } from '../lib/types'

type Props = {
  filters:      ReportsFilters
  clients:      Client[]
  projects:     Project[]
  tags:         string[]
  onPresetChange:    (p: PeriodPreset) => void
  onFromChange:      (d: string) => void
  onToChange:        (d: string) => void
  onClientChange:    (id: string) => void
  onProjectChange:   (id: string) => void
  onTagChange:       (tag: string) => void
}

const PRESETS: Array<{ value: PeriodPreset; label: string }> = [
  { value: '7d',     label: '7 dni'  },
  { value: '30d',    label: '30 dni' },
  { value: '90d',    label: '90 dni' },
  { value: 'custom', label: 'Własny' },
]

const FIELD_CLASSES =
  'h-11 w-full rounded-xl border border-[#1a1a1a] bg-[#0e0e0e] px-3 text-sm text-zinc-200 ' +
  'placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-zinc-500/60 disabled:opacity-50'

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-2xs font-semibold uppercase tracking-[0.18em] text-zinc-400"
    >
      {children}
    </label>
  )
}

export function ReportsFilterForm({
  filters,
  clients,
  projects,
  tags,
  onPresetChange,
  onFromChange,
  onToChange,
  onClientChange,
  onProjectChange,
  onTagChange,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FieldLabel htmlFor="reports-preset">Zakres</FieldLabel>
        <div
          role="tablist"
          aria-label="Zakres czasu"
          id="reports-preset"
          className="grid grid-cols-4 gap-1 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-1"
        >
          {PRESETS.map((p) => {
            const active = filters.preset === p.value
            return (
              <button
                key={p.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onPresetChange(p.value)}
                className={
                  'h-9 rounded-lg text-xs font-medium transition-colors ' +
                  (active
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:bg-[#141414] hover:text-zinc-200')
                }
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <FieldLabel htmlFor="reports-from">Od</FieldLabel>
          <input
            id="reports-from"
            type="date"
            value={filters.from}
            onChange={(e) => onFromChange(e.target.value)}
            className={FIELD_CLASSES}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor="reports-to">Do</FieldLabel>
          <input
            id="reports-to"
            type="date"
            value={filters.to}
            onChange={(e) => onToChange(e.target.value)}
            className={FIELD_CLASSES}
          />
        </div>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="reports-client">Klient</FieldLabel>
        <select
          id="reports-client"
          value={filters.clientId}
          onChange={(e) => onClientChange(e.target.value)}
          className={FIELD_CLASSES}
        >
          <option value="all">Wszyscy klienci</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="reports-project">Projekt</FieldLabel>
        <select
          id="reports-project"
          value={filters.projectId}
          onChange={(e) => onProjectChange(e.target.value)}
          className={FIELD_CLASSES}
        >
          <option value="all">Wszystkie projekty</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="reports-tag">Tag</FieldLabel>
        <select
          id="reports-tag"
          value={filters.tag}
          onChange={(e) => onTagChange(e.target.value)}
          className={FIELD_CLASSES}
        >
          <option value="all">Wszystkie tagi</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
