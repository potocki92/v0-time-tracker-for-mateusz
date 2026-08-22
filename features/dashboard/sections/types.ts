import type { ComponentType } from 'react'

export type SectionTier = 'hero' | 'primary' | 'secondary' | 'archive'

/** Okres wybrany zakladkami Pulpitu, znormalizowany do czterech ziaren. */
export type DashboardPeriod = 'week' | 'month' | 'quarter' | 'year'

export interface DashboardSectionDef {
  /** stabilne id, uzywane jako klucz w persist — NIGDY nie zmieniaj po wydaniu */
  id: string
  /** tytul sekcji w skorupie; przy zwinieciu jest jedynym, co widac */
  title: string
  tier: SectionTier
  /** czy sekcja reaguje na globalny wybor okresu (zakladki Tydzien/Miesiac/Kwartal/Rok) */
  respondsToPeriod: boolean
  /** wlasny zakres pokazywany w naglowku, gdy respondsToPeriod === false */
  ownRangeLabel?: string
  /** hero i primary montuja sie od razu, reszta leniwie przy zblizeniu do viewportu */
  loading: 'eager' | 'lazy'
  defaultVisible: boolean
  defaultCollapsed: boolean
  Component: ComponentType<{ period: DashboardPeriod }>
}

export interface SectionLayoutState {
  id: string
  visible: boolean
  collapsed: boolean
  order: number
}
