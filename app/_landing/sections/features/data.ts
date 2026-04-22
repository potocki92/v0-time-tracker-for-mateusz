import {
  Clock,
  FolderKanban,
  Users,
  FileText,
  CalendarDays,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'

export interface FeatureItem {
  icon: LucideIcon
  title: string
  description: string
}

export const FEATURE_ITEMS: FeatureItem[] = [
  {
    icon: Clock,
    title: 'Precyzyjne śledzenie czasu',
    description:
      'Uruchom timer jednym kliknięciem lub dopisz wpis ręcznie. Aplikacja działa online i offline — nic nie zginie.',
  },
  {
    icon: FolderKanban,
    title: 'Zarządzanie projektami',
    description:
      'Grupuj zadania w projekty, przydzielaj stawki godzinowe i pilnuj budżetu w czasie rzeczywistym.',
  },
  {
    icon: Users,
    title: 'Baza klientów (CRM)',
    description:
      'Trzymaj dane klientów, adresy do faktur i historię współpracy w jednym, przejrzystym miejscu.',
  },
  {
    icon: FileText,
    title: 'Faktury PDF',
    description:
      'Generuj profesjonalne faktury z wpisów czasu pracy. Wysyłka e-mailem, eksport do PDF, gotowe do księgowości.',
  },
  {
    icon: CalendarDays,
    title: 'Kalendarz i planowanie',
    description:
      'Widok kalendarza pokazuje kiedy, nad czym i jak długo pracujesz. Planuj tydzień z wyprzedzeniem.',
  },
  {
    icon: BarChart3,
    title: 'Raporty i analityka',
    description:
      'Dashboardy, wykresy produktywności, podsumowania miesięczne — dane, które wspierają decyzje biznesowe.',
  },
]
