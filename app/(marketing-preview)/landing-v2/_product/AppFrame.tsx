'use client'

import type { ReactNode } from 'react'
import { m, type MotionValue } from 'framer-motion'
import {
  Bell,
  Calendar,
  ChevronRight,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LineChart,
  Play,
  Plug,
  Search,
  Sparkles,
  Target,
  Users,
  Wallet,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

import {
  WORKSPACE_GROUP_LABELS,
  WORKSPACE_SECTIONS,
  type WorkspaceGroup,
  type WorkspaceSegment,
} from '@/lib/workspace/sections'

import { DEMO_PROJECTS, demoClient } from '../_demo/demo-data'

/**
 * Chrome aplikacji: sidebar + naglowek + dolny pasek mobilny.
 *
 * Nawigacja idzie z `lib/workspace/sections` — tego samego rejestru, ktory
 * zasila prawdziwy sidebar, breadcrumb i dolny pasek. Kolejnosc, etykiety,
 * skroty i badge'e nie moga wiec rozjechac sie z produktem; dopisanie sekcji
 * w aplikacji zmienia rowniez marketingowa replike.
 *
 * Chrome renderuje sie DOKLADNIE RAZ na scene — przy przewijaniu zmienia sie
 * tylko zawartosc i podswietlenie, wiec sidebar i naglowek nie migaja.
 */

const SECTION_ICONS: Record<WorkspaceSegment, LucideIcon> = {
  dashboard: LayoutDashboard,
  calendar: Calendar,
  projects: FolderKanban,
  clients: Users,
  invoices: FileText,
  reports: LineChart,
  goals: Target,
  earnings: Wallet,
  'ai-assistant': Sparkles,
  integrations: Plug,
  automations: Workflow,
}

const GROUP_ORDER: readonly WorkspaceGroup[] = ['workspace', 'stats', 'automation']

const BOTTOM_SEGMENTS: readonly WorkspaceSegment[] = [
  'dashboard',
  'calendar',
  'projects',
  'clients',
  'invoices',
]

export interface AppFrameProps {
  /** Statycznie podswietlona sekcja. */
  active?: WorkspaceSegment
  /** Podswietlenie sterowane scrollem: sekcja → krzywa widocznosci. */
  activeMotion?: Partial<Record<WorkspaceSegment, MotionValue<number>>>
  /** Tresc breadcrumba; domyslnie etykieta sekcji `active`. */
  breadcrumb?: ReactNode
  /**
   * Opis calej sceny dla czytnika ekranu. Ramka jest zlozona ilustracja, wiec
   * dostaje `role="img"` i jedna nazwe zamiast setki nieczytelnych wezlow.
   */
  label: string
  children: ReactNode
}

export function AppFrame({ active, activeMotion, breadcrumb, label, children }: AppFrameProps) {
  const section = WORKSPACE_SECTIONS.find((entry) => entry.segment === active)

  return (
    <div className="lv2-device flex h-full min-h-0 w-full" role="img" aria-label={label}>
      <Sidebar active={active} activeMotion={activeMotion} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-9 shrink-0 items-center gap-1.5 border-b border-[var(--lv2-hair)] px-3">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 lv2-t10">
            {breadcrumb ?? (
              <>
                <span className="hidden text-zinc-400 sm:inline">
                  {section ? WORKSPACE_GROUP_LABELS[section.group] : ''}
                </span>
                <ChevronRight className="hidden size-2.5 text-zinc-400 sm:block" />
                <span className="text-zinc-200">{section?.label}</span>
              </>
            )}
          </div>

          <span className="flex items-center gap-2 text-zinc-400">
            <Bell className="size-3" />
            <span className="lv2-mono flex items-center gap-1 rounded-md border border-[var(--lv2-hair-2)] px-1.5 py-0.5 lv2-t9 tabular-nums text-zinc-300">
              <Play className="size-2 fill-current" />
              02:14:08
            </span>
          </span>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden p-2.5 sm:p-3">{children}</div>

        <BottomNav active={active} activeMotion={activeMotion} />
      </div>
    </div>
  )
}

/* ─────────────────────────────── sidebar ─────────────────────────────── */

function Sidebar({
  active,
  activeMotion,
}: Pick<AppFrameProps, 'active' | 'activeMotion'>) {
  return (
    <aside className="hidden w-[164px] shrink-0 flex-col border-r border-[var(--lv2-hair)] bg-[var(--lv2-s1)] p-2 lg:flex">
      <div className="flex items-center gap-1.5 px-1 pb-2">
        <span className="size-4 rounded-[5px] bg-[var(--lv2-accent)]" />
        <span className="lv2-t11 font-semibold tracking-tight text-white">TimeTracker</span>
      </div>

      <div className="mb-1.5 flex h-6 items-center gap-1.5 rounded-md border border-[var(--lv2-hair-2)] px-1.5 lv2-t10 text-zinc-400">
        <Search className="size-2.5" />
        <span className="flex-1">Szukaj…</span>
        <span className="lv2-mono rounded border border-[var(--lv2-hair-2)] px-1 lv2-t8">⌘K</span>
      </div>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-hidden">
        {GROUP_ORDER.map((group) => (
          <div key={group}>
            <p className="px-1.5 py-1 lv2-t8 font-medium uppercase tracking-[0.1em] text-zinc-400">
              {WORKSPACE_GROUP_LABELS[group]}
            </p>
            {WORKSPACE_SECTIONS.filter((section) => section.group === group).map((section) => {
              const Icon = SECTION_ICONS[section.segment]
              return (
                <NavRow
                  key={section.segment}
                  icon={Icon}
                  label={section.label}
                  shortcut={section.shortcut}
                  badge={section.badge}
                  count={section.segment === 'invoices' ? 3 : undefined}
                  active={active === section.segment}
                  activeMotion={activeMotion?.[section.segment]}
                />
              )
            })}
          </div>
        ))}

        <div>
          <p className="px-1.5 py-1 lv2-t8 font-medium uppercase tracking-[0.1em] text-zinc-400">
            Przypięte
          </p>
          {DEMO_PROJECTS.map((project) => (
            <div
              key={project.id}
              className="flex h-[22px] items-center gap-1.5 rounded-md px-1.5 lv2-t10 text-zinc-400"
            >
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ background: demoClient(project.clientId).color }}
              />
              <span className="truncate">{project.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 space-y-1.5 border-t border-[var(--lv2-hair)] pt-2">
        <div className="lv2-card-nested flex items-center justify-between px-1.5 py-1">
          <span className="truncate lv2-t9 text-zinc-400">Im Winkel 51</span>
          <span className="lv2-mono lv2-t10 tabular-nums text-white">02:14:08</span>
        </div>
        <div className="flex items-center gap-1.5 px-1">
          <span className="flex size-4 items-center justify-center rounded-full bg-[var(--lv2-s3)] lv2-t7 font-semibold text-zinc-300">
            MP
          </span>
          <span className="truncate lv2-t10 text-zinc-300">Mateusz Potocki</span>
        </div>
      </div>
    </aside>
  )
}

function NavRow({
  icon: Icon,
  label,
  shortcut,
  badge,
  count,
  active,
  activeMotion,
}: {
  icon: LucideIcon
  label: string
  shortcut?: string
  badge?: string
  count?: number
  active: boolean
  activeMotion?: MotionValue<number>
}) {
  return (
    <div className="relative flex h-[22px] items-center gap-1.5 rounded-md px-1.5">
      {/* Podswietlenie jest OSOBNA warstwa, zeby scroll zmienial tylko jej
          `opacity` — tekst i ikona nie przerysowuja sie ani razu. */}
      {activeMotion ? (
        <m.span
          className="absolute inset-0 rounded-md bg-[var(--lv2-accent-dim)]"
          style={{ opacity: activeMotion }}
        />
      ) : (
        active && <span className="absolute inset-0 rounded-md bg-[var(--lv2-accent-dim)]" />
      )}

      <Icon className="relative size-3 shrink-0 text-zinc-400" strokeWidth={1.6} />
      <span className="relative flex-1 truncate lv2-t10 text-zinc-300">{label}</span>

      {badge && (
        <span className="relative rounded bg-white/5 px-1 lv2-t7 font-semibold uppercase text-zinc-400">
          {badge}
        </span>
      )}
      {count !== undefined && (
        <span className="lv2-mono relative rounded bg-white/5 px-1 lv2-t8 tabular-nums text-zinc-400">
          {count}
        </span>
      )}
      {shortcut && !badge && count === undefined && (
        <span className="lv2-mono relative rounded border border-[var(--lv2-hair-2)] px-1 lv2-t7 text-zinc-400">
          {shortcut}
        </span>
      )}
    </div>
  )
}

/* ─────────────────────────── dolny pasek (mobile) ─────────────────────── */

function BottomNav({ active, activeMotion }: Pick<AppFrameProps, 'active' | 'activeMotion'>) {
  return (
    <nav className="flex h-11 shrink-0 items-stretch border-t border-[var(--lv2-hair)] bg-[var(--lv2-s1)] lg:hidden">
      {BOTTOM_SEGMENTS.map((segment) => {
        const section = WORKSPACE_SECTIONS.find((entry) => entry.segment === segment)!
        const Icon = SECTION_ICONS[segment]
        const motion = activeMotion?.[segment]
        return (
          <div key={segment} className="relative flex flex-1 flex-col items-center justify-center gap-0.5">
            {motion ? (
              <m.span
                className="absolute inset-x-2 inset-y-1 rounded-lg bg-[var(--lv2-accent-dim)]"
                style={{ opacity: motion }}
              />
            ) : (
              active === segment && (
                <span className="absolute inset-x-2 inset-y-1 rounded-lg bg-[var(--lv2-accent-dim)]" />
              )
            )}
            <Icon className="relative size-4 text-zinc-400" strokeWidth={1.6} />
            <span className="relative lv2-t8 text-zinc-400">{section.label}</span>
          </div>
        )
      })}
    </nav>
  )
}
