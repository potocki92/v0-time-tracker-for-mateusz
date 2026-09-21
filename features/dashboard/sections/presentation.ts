import {
  Activity,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChartNoAxesColumnIncreasing,
  Coins,
  FileText,
  FolderKanban,
  Gauge,
  PieChart,
  Plane,
  Sun,
  Target,
  Timer,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/**
 * Ikona naglowka karty, po id sekcji.
 *
 * Osobno od rejestru i osobno od stanu: rejestr niesie KOMPONENTY i uklad
 * startowy, `use-dashboard-layout` trzyma uklad uzytkownika w localStorage,
 * a komponent Lucide nie jest wartoscia serializowalna — w zapisanym ukladzie
 * nie ma czego takiego trzymac. Zostaje trzecia, czysto prezentacyjna mapa,
 * czytana w momencie renderu naglowka.
 *
 * Brak wpisu nie jest bledem: karta rysuje wtedy sam tytul.
 */
export const SECTION_ICONS: Readonly<Record<string, LucideIcon>> = {
  'today-overview': Sun,
  'earnings-month': Coins,
  'monthly-goal': Target,
  'hours-month': Timer,
  trips: Plane,
  activity: Activity,
  'projects-schedule': FolderKanban,
  invoices: FileText,
  'weekly-accounting-summary': CalendarDays,
  'activity-analysis': PieChart,
  quarters: CalendarRange,
  'year-heatmap': ChartNoAxesColumnIncreasing,
  upcoming: CalendarClock,
  'effective-rate': Gauge,
  'quick-actions': Zap,
}
