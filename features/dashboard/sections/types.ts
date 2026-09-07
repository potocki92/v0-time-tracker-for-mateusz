import type { ComponentType } from 'react'

export type SectionTier = 'hero' | 'primary' | 'secondary' | 'archive'

/** Okres wybrany zakladkami Pulpitu, znormalizowany do czterech ziaren. */
export type DashboardPeriod = 'week' | 'month' | 'quarter' | 'year'

export interface DashboardSectionDef {
  /** stabilne id, uzywane jako klucz w persist — NIGDY nie zmieniaj po wydaniu */
  id: string
  /** tytul sekcji w skorupie; przy zwinieciu jest jedynym, co widac */
  title: string
  /**
   * POCZATKOWE miejsce sekcji w ukladzie — zasiew kolejnosci, nie stala
   * wlasciwosc. O tym, co jest nad zagieciem, decyduje pozycja w ukladzie
   * uzytkownika (patrz `dashboard-sections.tsx`), wiec kazda sekcja moze
   * skonczyc jako karta wiodaca albo jako zwinieta pozycja listy.
   */
  tier: SectionTier
  /** czy sekcja reaguje na globalny wybor okresu (zakladki Tydzien/Miesiac/Kwartal/Rok) */
  respondsToPeriod: boolean
  /** wlasny zakres pokazywany w naglowku, gdy respondsToPeriod === false */
  ownRangeLabel?: string
  /**
   * Domyslny moment montowania. Sekcja, ktora uzytkownik postawil nad
   * zagieciem, montuje sie od razu niezaleznie od tej wartosci — kod i tak
   * przychodzi osobnym chunkiem.
   */
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
