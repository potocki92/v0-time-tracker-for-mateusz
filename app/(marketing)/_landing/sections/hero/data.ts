import {
  Calendar,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from 'lucide-react'

export const START_SECONDS = 2 * 3600 + 14 * 60 + 8

export interface NavItem {
  label: string
  icon: LucideIcon
  active?: boolean
  badge?: number
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Calendar', icon: Calendar },
  { label: 'Projects', icon: FolderKanban, badge: 4 },
  { label: 'Clients', icon: Users, badge: 7 },
  { label: 'Invoices', icon: FileText, badge: 5 },
]

export const KPI_ROWS = [
  { label: 'Tracked', value: '163.2h', sub: 'this period' },
  { label: 'Billable', value: '€5,563', sub: 'invoiceable' },
  { label: 'Outstanding', value: '€2,436', sub: 'awaiting payment' },
] as const

export interface LiveEntry {
  color: string
  title: string
  sub: string
  time?: string
  live?: boolean
}

export const LIVE_ENTRIES: LiveEntry[] = [
  {
    color: '#22E07A',
    title: 'Im Winkel 51 · Foundation review',
    sub: 'Rafał Gawlik',
    live: true,
  },
  {
    color: '#74A9F0',
    title: 'Q2 retainer · Strategy sync',
    sub: 'JH Smart Solutions',
    time: '1.5h',
  },
  {
    color: '#E66F8E',
    title: 'Hans‑Böckler‑Str. 284 · Site visit',
    sub: 'Tomasz Ignor',
    time: '4.0h',
  },
]

export const TRUST_BADGES = ['No credit card', '14-day Pro trial', 'Cancel anytime'] as const

export type ChartRange = 'week' | 'month' | 'year'

export const CHART_RANGES: ChartRange[] = ['week', 'month', 'year']

export const CHART_DATA: Record<ChartRange, number[]> = {
  week: [38, 52, 30, 64, 44, 70, 36, 58, 48, 78, 42, 92],
  month: [54, 40, 62, 48, 70, 58, 80, 46, 66, 52, 74, 60],
  year: [60, 72, 50, 84, 66, 90, 58, 76, 68, 88, 62, 96],
}
