'use client'

import type { ReactNode } from 'react'
import { m, type MotionValue } from 'framer-motion'
import {
  Bell,
  Calendar,
  ChevronRight,
  FileText,
  PanelLeft,
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

import { useTranslations } from 'next-intl'

import type { WorkspaceGroup, WorkspaceSegment } from '@/lib/workspace/sections'

import { DEMO_PROJECTS, demoClient } from '../demo/demo-data'
import { MARKETING_BOTTOM_SEGMENTS, MARKETING_SECTIONS } from './nav'

/**
 * Chrome aplikacji: sidebar + naglowek + dolny pasek mobilny.
 *
 * Nawigacja idzie z `./nav` — rejestru panelu (`lib/workspace/sections`)
 * przepuszczonego przez filtr marketingowy. Kolejnosc, etykiety, skroty i
 * badge'e nie moga wiec rozjechac sie z produktem; dopisanie sekcji w
 * aplikacji zmienia rowniez marketingowa replike. Jedyne odstepstwa od
 * rejestru sa zebrane i uzasadnione w `./nav`.
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
  const t = useTranslations('navigation')
  const section = MARKETING_SECTIONS.find((entry) => entry.segment === active)

  /**
   * Sekcje spoza dolnego paska (w praktyce: Raporty) osiaga sie na telefonie
   * przez sidebar otwierany hamburgerem — pasek pokazuje tylko obszar
   * roboczy. Bez tego scena „Raporty" zostawiala caly chrome bez zadnego
   * aktywnego elementu i pasek wygladal na zepsuty.
   */
  const menuMotion = activeMotion
    ? Object.entries(activeMotion).find(
        ([segment]) => !MARKETING_BOTTOM_SEGMENTS.includes(segment as WorkspaceSegment),
      )?.[1]
    : undefined
  const menuActive = active !== undefined && !MARKETING_BOTTOM_SEGMENTS.includes(active)

  return (
    <div className="lp-device flex h-full min-h-0 w-full" role="img" aria-label={label}>
      <Sidebar active={active} activeMotion={activeMotion} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-9 shrink-0 items-center gap-1.5 border-b border-[var(--lp-hair)] px-3">
          <span className="relative -ml-0.5 mr-0.5 flex size-5 shrink-0 items-center justify-center rounded md:hidden">
            {menuMotion ? (
              <m.span
                className="absolute inset-0 rounded bg-[var(--lp-accent-dim)]"
                style={{ opacity: menuMotion }}
              />
            ) : (
              menuActive && <span className="absolute inset-0 rounded bg-[var(--lp-accent-dim)]" />
            )}
            <PanelLeft className="relative size-3 text-zinc-400" strokeWidth={1.6} />
          </span>

          <div className="flex min-w-0 flex-1 items-center gap-1.5 lp-t10">
            {breadcrumb ?? (
              <>
                <span className="hidden text-zinc-400 sm:inline">
                  {section ? t(`groups.${section.group}`) : ''}
                </span>
                <ChevronRight className="hidden size-2.5 text-zinc-400 sm:block" />
                <span className="text-zinc-200">
                  {section ? t(`sections.${section.segment}`) : ''}
                </span>
              </>
            )}
          </div>

          <span className="flex items-center gap-2 text-zinc-400">
            <Bell className="size-3" />
            <span className="lp-mono flex items-center gap-1 rounded-md border border-[var(--lp-hair-2)] px-1.5 py-0.5 lp-t9 tabular-nums text-zinc-300">
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
  const t = useTranslations('navigation')
  const marketing = useTranslations('marketing.app')

  return (
    <aside className="hidden w-[164px] shrink-0 flex-col border-r border-[var(--lp-hair)] bg-[var(--lp-s1)] p-2 md:flex">
      <div className="flex items-center gap-1.5 px-1 pb-2">
        <span className="size-4 rounded-[5px] bg-[var(--lp-accent)]" />
        <span className="lp-t11 font-semibold tracking-tight text-white">TimeTracker</span>
      </div>

      <div className="mb-1.5 flex h-6 items-center gap-1.5 rounded-md border border-[var(--lp-hair-2)] px-1.5 lp-t10 text-zinc-400">
        <Search className="size-2.5" />
        <span className="flex-1">{marketing('search')}</span>
        <span className="lp-mono rounded border border-[var(--lp-hair-2)] px-1 lp-t8">⌘K</span>
      </div>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-hidden">
        {GROUP_ORDER.map((group) => (
          <div key={group}>
            <p className="px-1.5 py-1 lp-t8 font-medium uppercase tracking-[0.1em] text-zinc-400">
              {t(`groups.${group}`)}
            </p>
            {MARKETING_SECTIONS.filter((section) => section.group === group).map((section) => {
              const Icon = SECTION_ICONS[section.segment]
              return (
                <NavRow
                  key={section.segment}
                  icon={Icon}
                  label={t(`sections.${section.segment}`)}
                  shortcut={section.shortcut}
                  badge={section.badge ? t(`badges.${section.badge}`) : undefined}
                  count={section.segment === 'invoices' ? 3 : undefined}
                  active={active === section.segment}
                  activeMotion={activeMotion?.[section.segment]}
                />
              )
            })}
          </div>
        ))}

        <div>
          <p className="px-1.5 py-1 lp-t8 font-medium uppercase tracking-[0.1em] text-zinc-400">
            {marketing('pinned')}
          </p>
          {DEMO_PROJECTS.map((project) => (
            <div
              key={project.id}
              className="flex h-[22px] items-center gap-1.5 rounded-md px-1.5 lp-t10 text-zinc-400"
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

      <div className="mt-2 space-y-1.5 border-t border-[var(--lp-hair)] pt-2">
        <div className="lp-card-nested flex items-center justify-between px-1.5 py-1">
          <span className="truncate lp-t9 text-zinc-400">Im Winkel 51</span>
          <span className="lp-mono lp-t10 tabular-nums text-white">02:14:08</span>
        </div>
        <div className="flex items-center gap-1.5 px-1">
          <span className="flex size-4 items-center justify-center rounded-full bg-[var(--lp-s3)] lp-t7 font-semibold text-zinc-300">
            MP
          </span>
          <span className="truncate lp-t10 text-zinc-300">Mateusz Potocki</span>
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
          className="absolute inset-0 rounded-md bg-[var(--lp-accent-dim)]"
          style={{ opacity: activeMotion }}
        />
      ) : (
        active && <span className="absolute inset-0 rounded-md bg-[var(--lp-accent-dim)]" />
      )}

      <Icon className="relative size-3 shrink-0 text-zinc-400" strokeWidth={1.6} />
      <span className="relative flex-1 truncate lp-t10 text-zinc-300">{label}</span>

      {badge && (
        <span className="relative rounded bg-white/5 px-1 lp-t7 font-semibold uppercase text-zinc-400">
          {badge}
        </span>
      )}
      {count !== undefined && (
        <span className="lp-mono relative rounded bg-white/5 px-1 lp-t8 tabular-nums text-zinc-400">
          {count}
        </span>
      )}
      {shortcut && !badge && count === undefined && (
        <span className="lp-mono relative rounded border border-[var(--lp-hair-2)] px-1 lp-t7 text-zinc-400">
          {shortcut}
        </span>
      )}
    </div>
  )
}

/* ─────────────────────────── dolny pasek (mobile) ─────────────────────── */

function BottomNav({ active, activeMotion }: Pick<AppFrameProps, 'active' | 'activeMotion'>) {
  const t = useTranslations('navigation')

  return (
    <nav className="flex h-11 shrink-0 items-stretch border-t border-[var(--lp-hair)] bg-[var(--lp-s1)] md:hidden">
      {MARKETING_BOTTOM_SEGMENTS.map((segment) => {
        const section = MARKETING_SECTIONS.find((entry) => entry.segment === segment)!
        const Icon = SECTION_ICONS[segment]
        const motion = activeMotion?.[segment]
        return (
          <div key={segment} className="relative flex flex-1 flex-col items-center justify-center gap-0.5">
            {motion ? (
              <m.span
                className="absolute inset-x-2 inset-y-1 rounded-lg bg-[var(--lp-accent-dim)]"
                style={{ opacity: motion }}
              />
            ) : (
              active === segment && (
                <span className="absolute inset-x-2 inset-y-1 rounded-lg bg-[var(--lp-accent-dim)]" />
              )
            )}
            <Icon className="relative size-4 text-zinc-400" strokeWidth={1.6} />
            <span className="relative lp-t8 text-zinc-400">
              {t(`sections.${section.segment}`)}
            </span>
          </div>
        )
      })}
    </nav>
  )
}
